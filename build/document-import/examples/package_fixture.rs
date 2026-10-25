use std::{env,fs,io};
fn main()->Result<(),Box<dyn std::error::Error>>{
 let args:Vec<_>=env::args().collect();if args.len()!=4{return Err("usage: package_fixture toc section output".into())}
 let mut builder=cab::CabinetBuilder::new();let folder=builder.add_folder(cab::CompressionType::MsZip);folder.add_file("Open Notebook.onetoc2");folder.add_file("New Section 1.one");
 let mut archive=builder.build(fs::File::create(&args[3])?)?;
 while let Some(mut writer)=archive.next_file()?{let file=if writer.file_name().ends_with("onetoc2"){&args[1]}else{&args[2]};io::copy(&mut fs::File::open(file)?,&mut writer)?;}
 archive.finish()?;Ok(())
}
