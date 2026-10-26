using System;
using System.IO;
using System.Diagnostics;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.IO.Compression;
using System.Xml;

// Native-only worker. No renderer paths/commands, global Office termination,
// Trust Center changes, original-file saves or unsolicited slideshow startup.
class PowerPointHost {
 static readonly JavaScriptSerializer Json=new JavaScriptSerializer{MaxJsonLength=65536,RecursionLimit=12};
 static dynamic Office,Presentation,Show;
 static SourceWindow Window;
 static System.Drawing.Rectangle Bounds;
 static double SlideWidth,SlideHeight;
 sealed class SlideState {public int Id,Index,ClickIndex,ClickCount;}
 static SlideState LastSlide;
 static int FinalVisibleIndex;
 static FileStream SourceLock;
 static string Session,Generation,SourceHash;
 static string Phase="idle";
 static string Stage="idle";
 static bool OwnApplication,Closing;
 static long LastId;
 static Microsoft.Office.Interop.PowerPoint.EApplication_SlideShowEndEventHandler EndHandler;
 static Microsoft.Office.Interop.PowerPoint.EApplication_SlideShowNextSlideEventHandler NextSlideHandler;
 static bool NavigationJump;
 static long NextObservation;
 static readonly List<int> SlideIds=new List<int>();
 static void Emit(object value){Console.WriteLine(Json.Serialize(value));Console.Out.Flush();}
 static void OnShowEnd(Microsoft.Office.Interop.PowerPoint.Presentation ended){
  if(Closing||Phase=="closed"||Window==null)return;
  try{if(!string.Equals((string)ended.FullName,(string)Presentation.FullName,StringComparison.OrdinalIgnoreCase))return;
   Window.Revoke();Phase="ended";Emit(new{kind="state",session=Session,generation=Generation,state=State()});
  }catch{Window.Revoke();Phase="ended";}
 }
 static void OnNextSlide(Microsoft.Office.Interop.PowerPoint.SlideShowWindow window){
  if(Closing||Window==null||NavigationJump||Phase=="ended")return;dynamic view=null;
  try{if(!string.Equals((string)window.Presentation.FullName,(string)Presentation.FullName,StringComparison.OrdinalIgnoreCase))return;
   view=window.View;int position=(int)view.CurrentShowPosition;
   if(position>SlideIds.Count){Window.Revoke();Phase="ended";Emit(new{kind="state",session=Session,generation=Generation,state=State()});return;}
   ReadSlide();Emit(new{kind="state",session=Session,generation=Generation,state=State()});
  }catch{ /* Transitions can temporarily lack a current slide. Observe on the STA loop. */ }finally{if((object)view!=null)Marshal.ReleaseComObject(view);}
 }
 static void ObserveSource(){
  if(Window==null||Closing||(Phase!="playing"&&Phase!="paused"))return;
  long now=Stopwatch.GetTimestamp();if(now<NextObservation)return;NextObservation=now+Stopwatch.Frequency/25;
  if(!Window.Valid()){Window.Revoke();Phase="ended";Emit(new{kind="state",session=Session,generation=Generation,state=State()});return;}
  try{int beforeId=LastSlide==null?0:LastSlide.Id,beforeClick=LastSlide==null?-1:LastSlide.ClickIndex;ReadSlide();if(beforeId!=LastSlide.Id||beforeClick!=LastSlide.ClickIndex)Emit(new{kind="state",session=Session,generation=Generation,state=State()});}
  catch(COMException error){
   // In a windowed show, Office may retain a visible child while its final
   // black end surface has no Slide. Do not keep reporting playback or let
   // capture continue into that retained Office window. No substitute timer.
   if(error.HResult==-2147188160&&LastSlide!=null&&LastSlide.Index>=FinalVisibleIndex){Window.Revoke();Phase="ended";Emit(new{kind="state",session=Session,generation=Generation,state=State()});}
   else{Window.Revoke();Phase="faulted";Emit(new{kind="error",id=0,code="POWERPOINT_SOURCE_UNAVAILABLE"});}
  }
 }
 static object State(){return new{phase=Phase,sourceHash=SourceHash,slideIds=SlideIds.ToArray(),applicationVisible=(object)Office!=null&&(int)Office.Visible==-1,slideId=LastSlide==null?0:LastSlide.Id,slideIndex=LastSlide==null?0:LastSlide.Index,clickIndex=LastSlide==null?0:LastSlide.ClickIndex,clickCount=LastSlide==null?0:LastSlide.ClickCount,capture=Window==null?null:Window.Identity};}
 static void ReadSlide(){
  dynamic view=null,slide=null;
  try{view=Show.View;slide=view.Slide;LastSlide=new SlideState{Id=(int)slide.SlideID,Index=(int)slide.SlideIndex,ClickIndex=(int)view.GetClickIndex(),ClickCount=(int)view.GetClickCount()};}
  finally{if((object)slide!=null)Marshal.ReleaseComObject(slide);if((object)view!=null)Marshal.ReleaseComObject(view);}
 }
 static void Begin(HostRequest request){
  if(Phase!="prepared")throw new InvalidOperationException("POWERPOINT_HOST_STATE");
  if((int)Office.Presentations.Count!=1||(int)Office.ProtectedViewWindows.Count!=0||(int)Office.Visible!=0)throw new InvalidOperationException("POWERPOINT_ALREADY_IN_USE");
  Stage="begin-source";Window=new SourceWindow();Bounds=Window.CoverBeforeActivation(Bounds,request.OutputWindowHandle);SourceWindow.PlaceApplication(Office,Bounds);
  Office.Visible=-1;dynamic settings=null;
  try{settings=Presentation.SlideShowSettings;settings.ShowType=2;settings.ShowScrollbar=0;settings.AdvanceMode=2;settings.LoopUntilStopped=0;Show=settings.Run();}
  finally{if((object)settings!=null)Marshal.ReleaseComObject(settings);}
  Window.Bind(Show,Bounds,Generation,SlideWidth,SlideHeight);Show.View.State=2;Phase="paused";ReadSlide();
 }
 static void Navigate(HostRequest request){
  if(Window==null||(object)Show==null||!Window.Valid())throw new InvalidOperationException("POWERPOINT_SOURCE_ENDED");
  if(Phase!="paused"&&Phase!="playing"&&Phase!="ended")throw new InvalidOperationException("POWERPOINT_HOST_STATE");
  Stage="navigate-source";ReadSlide();dynamic view=null;
  try{view=Show.View;
   if(request.Op=="play"){if(Phase=="ended")throw new InvalidOperationException("POWERPOINT_SOURCE_ENDED");view.State=1;Phase="playing";}
   else if(request.Op=="pause"){view.State=2;Phase="paused";}
   else if(request.Op=="goto"){int index=SlideIds.IndexOf(request.SlideId);if(index<0)throw new InvalidDataException("POWERPOINT_SLIDE_ID");NavigationJump=true;try{view.GotoSlide(index+1,-1);}finally{NavigationJump=false;}if(Phase=="ended"){view.State=2;Phase="paused";}}
   else if(request.Op=="previous"){NavigationJump=true;try{if(LastSlide.Index>1||LastSlide.ClickIndex>0)view.Previous();}finally{NavigationJump=false;}if(Phase=="ended"){view.State=2;Phase="paused";}}
   else if(request.Op=="next"){
    // Hand the last slide back to the live controller rather than showing
    // PowerPoint's black end screen or exposing the editor after its closure.
    if(LastSlide.Index>=FinalVisibleIndex&&LastSlide.ClickIndex>=LastSlide.ClickCount){view.State=2;Phase="ended";}else view.Next();
   }
  }finally{if((object)view!=null)Marshal.ReleaseComObject(view);}
  Application.DoEvents();ReadSlide();
 }
 static string Hash(Stream stream){stream.Position=0;using(var sha=SHA256.Create()){var result=BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();stream.Position=0;return result;}}
 static string ReadLineBounded(){var line=new System.Text.StringBuilder();for(;;){int value=Console.In.Read();if(value<0)return line.Length==0?null:line.ToString();if(value=='\n')return line.ToString();if(value=='\r')continue;if(value==0||line.Length>=65536)throw new InvalidDataException("POWERPOINT_HOST_PROTOCOL");line.Append((char)value);}}
 static void InspectPackage(Stream stream){
  stream.Position=0;using(var zip=new ZipArchive(stream,ZipArchiveMode.Read,true)){
   if(zip.Entries.Count>10000)throw new InvalidDataException("POWERPOINT_PACKAGE_BOUND");long expanded=0;
   foreach(var entry in zip.Entries){
    string name=entry.FullName.ToLowerInvariant();expanded+=entry.Length;
    if(name.IndexOf('\\')>=0||name.StartsWith("/",StringComparison.Ordinal)||name.IndexOf(':')>=0||Array.IndexOf(name.Split('/'),"..")>=0||entry.Length>32*1024*1024||expanded>256L*1024*1024)throw new InvalidDataException("POWERPOINT_PACKAGE_BOUND");
    if(name.EndsWith("vbaproject.bin",StringComparison.Ordinal)||name.StartsWith("ppt/embeddings/",StringComparison.Ordinal)||name.StartsWith("ppt/activex/",StringComparison.Ordinal))throw new InvalidDataException("POWERPOINT_ACTIVE_CONTENT_UNSUPPORTED");
    if(!name.EndsWith(".rels",StringComparison.Ordinal))continue;
    var settings=new XmlReaderSettings{DtdProcessing=DtdProcessing.Prohibit,XmlResolver=null,MaxCharactersInDocument=32L*1024*1024};
    using(var input=entry.Open())using(var reader=XmlReader.Create(input,settings))while(reader.Read())if(reader.NodeType==XmlNodeType.Element&&reader.LocalName=="Relationship"){
     string type=reader.GetAttribute("Type")??"",mode=reader.GetAttribute("TargetMode")??"";
     if(mode=="External")throw new InvalidDataException("POWERPOINT_EXTERNAL_CONTENT_UNSUPPORTED");
     if(type.EndsWith("/audio",StringComparison.Ordinal)||type.EndsWith("/video",StringComparison.Ordinal)||type.EndsWith("/media",StringComparison.Ordinal))throw new InvalidDataException("POWERPOINT_MEDIA_UNSUPPORTED");
     if(type.EndsWith("/oleObject",StringComparison.Ordinal)||type.EndsWith("/control",StringComparison.Ordinal))throw new InvalidDataException("POWERPOINT_ACTIVE_CONTENT_UNSUPPORTED");
    }
   }
  }stream.Position=0;
 }
 static void Prepare(HostRequest request){
  if(Phase!="idle")throw new InvalidOperationException("POWERPOINT_HOST_ALREADY_PREPARED");Bounds=SourceWindow.ValidateBounds(request);
  if(Process.GetProcessesByName("POWERPNT").Length!=0)throw new InvalidOperationException("POWERPOINT_ALREADY_IN_USE");
  var info=new FileInfo(request.SourcePath);if(!info.Exists||info.Length<=0||info.Length>128L*1024*1024||(info.Attributes&FileAttributes.ReparsePoint)!=0)throw new InvalidDataException("POWERPOINT_SOURCE_INTEGRITY");
  Stage="verify-source";SourceLock=new FileStream(request.SourcePath,FileMode.Open,FileAccess.Read,FileShare.Read);
  SourceSecurity.CheckFile(request.SourcePath);
  if(Hash(SourceLock)!=request.SourceHash)throw new InvalidDataException("POWERPOINT_SOURCE_INTEGRITY");InspectPackage(SourceLock);
  Type type=Type.GetTypeFromProgID("PowerPoint.Application");if(type==null)throw new InvalidOperationException("POWERPOINT_NOT_INSTALLED");
  Stage="create-office";Office=Activator.CreateInstance(type);
  if((int)Office.Presentations.Count!=0||(int)Office.ProtectedViewWindows.Count!=0||(int)Office.Visible==-1)throw new InvalidOperationException("POWERPOINT_ALREADY_IN_USE");
  OwnApplication=true;Stage="open-source";int security=(int)Office.AutomationSecurity,alerts=(int)Office.DisplayAlerts;
  EndHandler=new Microsoft.Office.Interop.PowerPoint.EApplication_SlideShowEndEventHandler(OnShowEnd);((Microsoft.Office.Interop.PowerPoint.Application)Office).SlideShowEnd+=EndHandler;
  NextSlideHandler=new Microsoft.Office.Interop.PowerPoint.EApplication_SlideShowNextSlideEventHandler(OnNextSlide);((Microsoft.Office.Interop.PowerPoint.Application)Office).SlideShowNextSlide+=NextSlideHandler;
  try{Office.AutomationSecurity=3;Office.DisplayAlerts=1;Presentation=Office.Presentations.Open(request.SourcePath,-1,0,0);}
  finally{Office.AutomationSecurity=security;Office.DisplayAlerts=alerts;}
  Stage="source-identity";if(!string.Equals(Path.GetFullPath((string)Presentation.FullName),request.SourcePath,StringComparison.OrdinalIgnoreCase)||(int)Presentation.ReadOnly!=-1)throw new InvalidDataException("POWERPOINT_SOURCE_IDENTITY");
  int count=(int)Presentation.Slides.Count;if(count<1||count>1000)throw new InvalidDataException("POWERPOINT_SLIDE_BOUND");
  double width=(double)Presentation.PageSetup.SlideWidth,height=(double)Presentation.PageSetup.SlideHeight;
  if(double.IsNaN(width)||double.IsNaN(height)||width<=0||height<=0||width>7200||height>7200)throw new InvalidDataException("POWERPOINT_SOURCE_GEOMETRY");
  SlideWidth=width;SlideHeight=height;
  int imageWidth=1920,imageHeight=(int)Math.Round(1920*height/width);if(imageHeight>1080){imageHeight=1080;imageWidth=(int)Math.Round(1080*width/height);}if(imageWidth<8||imageHeight<8)throw new InvalidDataException("POWERPOINT_SOURCE_GEOMETRY");
  string folder=Path.Combine(Path.GetDirectoryName(Path.GetDirectoryName(request.SourcePath)),"powerpoint-thumbnails",request.SourceHash);Directory.CreateDirectory(folder);
  for(int index=1;index<=count;index++){
   Stage="export-slide";dynamic slide=Presentation.Slides.Item(index);
   try{
    if((int)slide.TimeLine.InteractiveSequences.Count!=0)throw new InvalidDataException("POWERPOINT_INTERACTIVE_TRIGGERS_UNSUPPORTED");
    int id=(int)slide.SlideID;if(id<=0||SlideIds.Contains(id))throw new InvalidDataException("POWERPOINT_SOURCE_IDENTITY");SlideIds.Add(id);
    dynamic transition=slide.SlideShowTransition;try{if((int)transition.Hidden!=-1)FinalVisibleIndex=index;}finally{Marshal.ReleaseComObject(transition);}
    // Office still applies MAX_PATH to Export even when the host can read the
    // longer source path. Export to an owned short directory, then copy into
    // the content-addressed cache without changing the source presentation.
    string staging=Path.Combine(Path.GetTempPath(),"gdr-ppt-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(staging);
    string temporary=Path.Combine(staging,"slide.png"),target=Path.Combine(folder,id.ToString(System.Globalization.CultureInfo.InvariantCulture)+".png");
    try{slide.Export(temporary,"PNG",imageWidth,imageHeight);var thumbnail=new FileInfo(temporary);if(!thumbnail.Exists||thumbnail.Length>16L*1024*1024)throw new InvalidDataException("POWERPOINT_THUMBNAIL_BOUND");File.Copy(temporary,target,true);}finally{if(File.Exists(temporary))File.Delete(temporary);Directory.Delete(staging,false);}
   }finally{Marshal.ReleaseComObject(slide);}
  }
  if(FinalVisibleIndex==0)throw new InvalidDataException("POWERPOINT_NO_VISIBLE_SLIDES");
  Session=request.Session;Generation=request.Generation;SourceHash=request.SourceHash;Phase="prepared";
 }
 static void Cleanup(){
  Stage="cleanup-source";Closing=true;
  try{if((object)Show!=null&&Window!=null&&Window.Valid())Show.View.Exit();}catch{}
  if((object)Show!=null){try{Marshal.FinalReleaseComObject(Show);}catch{}Show=null;}
  try{if((object)Presentation!=null){Presentation.Saved=-1;Presentation.Close();}}catch{}
  try{if(OwnApplication&&(object)Office!=null&&(int)Office.Presentations.Count==0&&(int)Office.ProtectedViewWindows.Count==0)Office.Quit();}catch{}
  if((object)Presentation!=null){try{Marshal.FinalReleaseComObject(Presentation);}catch{}Presentation=null;}
  if((object)Office!=null&&EndHandler!=null){try{((Microsoft.Office.Interop.PowerPoint.Application)Office).SlideShowEnd-=EndHandler;}catch{}EndHandler=null;}
  if((object)Office!=null&&NextSlideHandler!=null){try{((Microsoft.Office.Interop.PowerPoint.Application)Office).SlideShowNextSlide-=NextSlideHandler;}catch{}NextSlideHandler=null;}
  if((object)Office!=null){try{Marshal.FinalReleaseComObject(Office);}catch{}Office=null;}
  if(SourceLock!=null){SourceLock.Dispose();SourceLock=null;}if(Window!=null){Window.Dispose();Window=null;}Phase="closed";
 }
 static void Dispatch(HostRequest request){
  if(request.Id<=LastId)throw new InvalidDataException("POWERPOINT_HOST_SEQUENCE");LastId=request.Id;
  if(Session!=null&&(request.Session!=Session||request.Generation!=Generation))throw new InvalidDataException("POWERPOINT_HOST_GENERATION");
  if(request.Op=="prepare")Prepare(request);
  else if(request.Op=="begin")Begin(request);
  else if(request.Op=="close"){Cleanup();Closing=true;}
  else if(request.Op=="status"){ObserveSource();}
  else Navigate(request);
  Emit(new{kind="reply",id=request.Id,session=request.Session,generation=request.Generation,state=State()});
 }
 [STAThread]static int Main(string[] args){
  if(args.Length!=0)return 2;
  // A supervised detached worker has pipes, not a Windows console. Setting
  // Console.InputEncoding would call SetConsoleCP on a nonexistent console.
  var utf8=new System.Text.UTF8Encoding(false,true);Console.SetIn(new StreamReader(Console.OpenStandardInput(),utf8,false,1024));Console.SetOut(new StreamWriter(Console.OpenStandardOutput(),utf8){AutoFlush=true});Console.SetError(new StreamWriter(Console.OpenStandardError(),utf8){AutoFlush=true});
  SourceWindow.EnablePhysicalCoordinates();
  SourceWindow.BindParent();
  Emit(new{kind="hello",protocol=1});Task<string> read=Task.Factory.StartNew<string>(ReadLineBounded);
  try{while(!Closing){if(!SourceWindow.ParentAlive)break;Application.DoEvents();ObserveSource();if(read.IsCompleted){string line=read.Result;if(line==null)break;HostRequest request=null;try{request=HostContract.Parse(line);Dispatch(request);}catch(Exception error){Console.Error.WriteLine("HOST_DIAGNOSTIC "+Stage+" "+error.GetType().Name+" "+error.HResult+" "+error.Message);string code=error is InvalidDataException||error is InvalidOperationException?error.Message:"POWERPOINT_HOST_FAILED";if(!System.Text.RegularExpressions.Regex.IsMatch(code,"^[A-Z0-9_]{1,80}$"))code="POWERPOINT_HOST_FAILED";Emit(new{kind="error",id=request==null?0:request.Id,code=code});if(request==null||request.Op=="prepare")break;}if(!Closing)read=Task.Factory.StartNew<string>(ReadLineBounded);}Thread.Sleep(5);}return 0;}
  catch{Emit(new{kind="error",id=0,code="POWERPOINT_HOST_FAILED"});return 1;}
  finally{Cleanup();}
 }
}
