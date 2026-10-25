use std::{env, fs, io::{self, Read, Write}, path::Path, process};
use onenote_parser::{Parser, contents::{Content, OutlineItem, Image}, page::PageContent, section::{Section, SectionEntry}};
use serde_json::{Value, json};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use typed_path::{TypedPath, PathType};

const MAX_FILE:u64=128*1024*1024;
const MAX_EXPANDED:u64=256*1024*1024;
const MAX_OUTPUT:usize=32*1024*1024;
#[derive(Default)]
struct PageData { text:Vec<String>, images:Vec<Value>, warnings:Vec<String> }
fn image(value:&Image,out:&mut PageData)->Result<(),String>{
 let extension=value.extension().unwrap_or("").to_ascii_lowercase();
 let mime=match extension.trim_start_matches('.') {"png"=>"image/png","jpg"|"jpeg"=>"image/jpeg","gif"=>"image/gif","webp"=>"image/webp",_=>{out.warnings.push("Ein Bildformat konnte nicht übernommen werden.".into());return Ok(())}};
 if value.size().unwrap_or(0)>8*1024*1024{return Err("Ein eingebettetes Bild ist zu groß.".into())}
 if let Some(reader)=value.read(){let mut data=Vec::new();reader.take(8*1024*1024+1).read_to_end(&mut data).map_err(|_|"Bild konnte nicht gelesen werden.")?;if data.len()>8*1024*1024{return Err("Bild zu groß.".into())}out.images.push(json!({"src":format!("data:{};base64,{}",mime,STANDARD.encode(data)),"alt":value.alt_text().unwrap_or("")}));}
 else{out.warnings.push("Ein verknüpftes Bild ist nicht in der Datei enthalten.".into())}Ok(())
}
fn contents(values:&[Content],out:&mut PageData,depth:usize)->Result<(),String>{
 if depth>64{return Err("Die Notiz ist zu tief verschachtelt.".into())}
 for value in values {match value {
  Content::RichText(text)=>out.text.push(text.text().to_string()),
  Content::Image(value)=>image(value,out)?,
  Content::Table(table)=>{for row in table.contents(){for cell in row.contents(){for element in cell.contents(){contents(element.contents(),out,depth+1)?;outline(element.children(),out,depth+1)?}}}},
  Content::Ink(_)=>out.warnings.push("Eine Freihandzeichnung wurde nicht übernommen.".into()),
  Content::EmbeddedFile(_)=>out.warnings.push("Eine Dateianlage wurde nicht geöffnet oder ausgeführt.".into()),
  _=>out.warnings.push("Ein unbekannter Inhaltsblock wurde ausgelassen.".into())
 }}Ok(())
}
fn outline(items:&[OutlineItem],out:&mut PageData,depth:usize)->Result<(),String>{
 if depth>64{return Err("Die Notiz ist zu tief verschachtelt.".into())}
 for item in items{match item{OutlineItem::Group(group)=>outline(group.outlines(),out,depth+1)?,OutlineItem::Element(element)=>{contents(element.contents(),out,depth+1)?;outline(element.children(),out,depth+1)?}}}Ok(())
}
fn section(section:&Section,pages:&mut Vec<Value>,warnings:&mut Vec<String>)->Result<(),String>{
 for warning in section.report().warnings(){warnings.push(warning.message().to_string())}
 for series in section.page_series(){for page in series.pages(){
  if pages.len()>=1000{return Err("Mehr als 1.000 Notizseiten werden nicht importiert.".into())}
  let mut out=PageData::default();
  for value in page.contents(){match value{PageContent::Outline(value)=>outline(value.items(),&mut out,0)?,PageContent::Image(value)=>image(value,&mut out)?,PageContent::Ink(_)=>out.warnings.push("Eine Freihandzeichnung wurde nicht übernommen.".into()),PageContent::EmbeddedFile(_)=>out.warnings.push("Eine Dateianlage wurde nicht geöffnet oder ausgeführt.".into()),_=>out.warnings.push("Ein unbekannter Seiteninhalt wurde ausgelassen.".into())}}
  let body=out.text.join("\n");if body.len()>200000{return Err("Eine Notizseite enthält zu viel Text.".into())}
  pages.push(json!({"title":page.title_text().unwrap_or("Notizseite"),"body":body,"images":out.images}));warnings.extend(out.warnings);
 }}Ok(())
}
fn entries(values:&[SectionEntry],pages:&mut Vec<Value>,warnings:&mut Vec<String>,depth:usize)->Result<(),String>{
 if depth>64{return Err("Zu viele verschachtelte Abschnitte.".into())}
 for value in values{match value{SectionEntry::Section(value)=>section(value,pages,warnings)?,SectionEntry::SectionGroup(value)=>entries(value.entries(),pages,warnings,depth+1)?}}Ok(())
}
fn preflight_package(data:&[u8])->Result<(),String>{
 let cabinet=cab::Cabinet::new(io::Cursor::new(data)).map_err(|_|"Ungültiges OneNote-Paket.")?;let mut total=0u64;let mut count=0;
 for entry in cabinet.folder_entries().flat_map(|folder|folder.file_entries()){
  count+=1;total=total.checked_add(entry.uncompressed_size() as u64).ok_or("Paket zu groß.")?;
  if count>2000||total>MAX_EXPANDED{return Err("Das entpackte OneNote-Paket ist zu groß.".into())}
  let name=entry.name().replace('\\',"/");if name.starts_with('/')||name.contains(':')||name.split('/').any(|part|part==".."){return Err("Unsicherer Dateipfad im OneNote-Paket.".into())}
 }Ok(())
}
fn run()->Result<(),String>{
 let args:Vec<_>=env::args_os().collect();if args.len()!=2{return Err("Genau eine OneNote-Datei erforderlich.".into())}
 let path=Path::new(&args[1]);let extension=path.extension().and_then(|v|v.to_str()).unwrap_or("").to_lowercase();if extension!="one"&&extension!="onepkg"{return Err("Nicht unterstützte Dateiendung.".into())}
 let metadata=fs::metadata(path).map_err(|_|"Die Datei konnte nicht geöffnet werden.")?;if !metadata.is_file()||metadata.len()>MAX_FILE||metadata.len()==0{return Err("Die Datei ist leer oder zu groß.".into())}
 let data=fs::read(path).map_err(|_|"Die Datei konnte nicht gelesen werden.")?;let mut pages=Vec::new();let mut warnings=vec!["OneNote-Inhalte werden als Präsentationsseiten neu angeordnet. Schriftformatierung, freie Positionierung, Freihandzeichnungen und Dateianlagen können abweichen.".to_string()];
 if extension=="one"{let parsed=Parser::new().parse_section_buffer(&data,TypedPath::new(b"import.one",PathType::Windows)).map_err(|_|"Die OneNote-Datei ist beschädigt, verschlüsselt oder nicht unterstützt.")?;section(&parsed,&mut pages,&mut warnings)?}
 else {preflight_package(&data)?;let text=path.to_str().ok_or("Ungültiger Dateipfad.")?;let kind=if cfg!(windows){PathType::Windows}else{PathType::Unix};let notebook=Parser::new().parse_package(TypedPath::new(text.as_bytes(),kind)).map_err(|_|"Das OneNote-Paket konnte nicht gelesen werden.")?;for warning in notebook.report().warnings(){warnings.push(warning.message().to_string())}entries(notebook.entries(),&mut pages,&mut warnings,0)?}
 if pages.is_empty(){return Err("Keine lesbaren OneNote-Seiten gefunden.".into())}warnings.sort();warnings.dedup();
 let result=serde_json::to_vec(&json!({"version":1,"pages":pages,"warnings":warnings})).map_err(|_|"Importbericht konnte nicht erstellt werden.")?;if result.len()>MAX_OUTPUT{return Err("Die importierten Inhalte sind zu groß.".into())}io::stdout().write_all(&result).map_err(|_|"Ausgabe fehlgeschlagen.")?;Ok(())
}
fn main(){if let Err(message)=run(){eprintln!("{}",message);process::exit(1)}}
