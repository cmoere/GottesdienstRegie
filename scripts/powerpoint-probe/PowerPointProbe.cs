// Diagnostic only. Creates/closes its own test documents; never used by the app.
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.Windows.Forms;

class PowerPointProbe {
  static JavaScriptSerializer json=new JavaScriptSerializer();
  static dynamic app,source,sentinel,show;
  static string root,sentinelPath,sentinelHash;
  static Screen authorizedScreen;
  static bool nativeNext;
  static bool edgePosition;
  static bool hiddenApplication;
  static IntPtr appFrameBeforeShow;
  static bool fullscreenSource;
  [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr hwnd,int index);
  [DllImport("user32.dll")] static extern bool MoveWindow(IntPtr hwnd,int x,int y,int w,int h,bool repaint);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd,out uint processId);
  [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr hwnd,uint flags);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
  [DllImport("user32.dll")] static extern uint GetDpiForWindow(IntPtr hwnd);
  [StructLayout(LayoutKind.Sequential)] struct Rect {public int left,top,right,bottom;}
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hwnd,out Rect rect);
  [StructLayout(LayoutKind.Sequential)] struct Point {public int x,y;}
  [DllImport("user32.dll")] static extern bool GetClientRect(IntPtr hwnd,out Rect rect);
  [DllImport("user32.dll")] static extern bool ClientToScreen(IntPtr hwnd,ref Point point);
  static void Emit(object value){Console.WriteLine(json.Serialize(value));Console.Out.Flush();}
  static string Hash(string path){using(var stream=File.OpenRead(path))using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();}
  static object State(){
    long hwnd=(long)((Microsoft.Office.Interop.PowerPoint.SlideShowWindow)show).HWND;
    Rect current;if(!GetWindowRect(GetAncestor(new IntPtr(hwnd),2),out current))throw new Exception("PROBE_CURRENT_RECT_FAILED");
    return new {slideId=(int)show.View.Slide.SlideID,slideIndex=(int)show.View.Slide.SlideIndex,clickIndex=(int)show.View.GetClickIndex(),clickCount=(int)show.View.GetClickCount(),state=(int)show.View.State,applicationVisible=(int)app.Visible,appFrameBeforeShow=appFrameBeforeShow.ToInt64().ToString(),appFrameVisible=IsWindowVisible(appFrameBeforeShow),showSharesAppFrame=appFrameBeforeShow==GetAncestor(new IntPtr(hwnd),2),showTopmost=(GetWindowLong(GetAncestor(new IntPtr(hwnd),2),-20)&8)!=0,windowGeometry=new{left=current.left,top=current.top,width=current.right-current.left,height=current.bottom-current.top},observedQpc=System.Diagnostics.Stopwatch.GetTimestamp().ToString(System.Globalization.CultureInfo.InvariantCulture)};
  }
  static void MakeSource(){
    source=app.Presentations.Add(0);
    source.PageSetup.SlideWidth=960;source.PageSetup.SlideHeight=540;
    int[] colors={64,16384,4194304};
    for(int i=1;i<=3;i++){
      dynamic slide=source.Slides.Add(i,12);
      slide.FollowMasterBackground=0;slide.Background.Fill.Solid();slide.Background.Fill.ForeColor.RGB=colors[i-1];
      dynamic text=slide.Shapes.AddTextbox(1,100,160,760,100);
      text.TextFrame.TextRange.Text="GottesdienstRegie · own probe " + i;
      text.TextFrame.TextRange.Font.Size=36;text.TextFrame.TextRange.Font.Color.RGB=16777215;
      // Continuous motion on the measured slides; keep slide2's timed-control fixture unchanged.
      if(i!=2){
        dynamic marker=slide.Shapes.AddShape(1,40,460,40,40);
        marker.Fill.ForeColor.RGB=65535;marker.Line.Visible=0;
        dynamic movement=slide.TimeLine.MainSequence.AddEffect(marker,0);
        dynamic behavior=movement.Behaviors.Add(1);
        behavior.MotionEffect.ByX=60;behavior.MotionEffect.ByY=0;
        movement.Timing.TriggerType=2;movement.Timing.Duration=1.5;
        movement.Timing.RepeatCount=200;movement.Timing.AutoReverse=-1;
      }
      if(i==1){
        for(int n=0;n<2;n++){
          dynamic shape=slide.Shapes.AddShape(1,100+n*300,320,240,80);
          shape.Fill.ForeColor.RGB=16777215;
          dynamic effect=slide.TimeLine.MainSequence.AddEffect(shape,10);
          effect.Timing.TriggerType=1;effect.Timing.Duration=0.25;
        }
      }
      slide.SlideShowTransition.AdvanceOnClick=-1;
      slide.SlideShowTransition.AdvanceOnTime=i==2?-1:0;
      slide.SlideShowTransition.AdvanceTime=2;
    }
    source.SaveAs(Path.Combine(root,"owned-source.pptx"),24);
  }
  static void Setup(){
    app=Activator.CreateInstance(Type.GetTypeFromProgID("PowerPoint.Application",true));
    if(authorizedScreen!=null){
      // Never reposition an Office application containing somebody else's work.
      if((int)app.Presentations.Count!=0)throw new Exception("PROBE_VISIBLE_APP_ALREADY_IN_USE");
      long appHwnd=(long)((Microsoft.Office.Interop.PowerPoint.Application)app).HWND;
      appFrameBeforeShow=GetAncestor(new IntPtr(appHwnd),2);
      var bounds=authorizedScreen.Bounds;
      var placement=new System.Drawing.Rectangle(bounds.X,bounds.Y,Math.Min(1920,bounds.Width),Math.Min(1080,bounds.Height));
      if(edgePosition){var screens=new System.Collections.Generic.List<System.Drawing.Rectangle>();foreach(var screen in Screen.AllScreens)screens.Add(screen.Bounds);var edge=SourcePlacement.FindEdge(bounds,screens.ToArray(),placement.Width,placement.Height,64);if(!edge.HasValue)throw new Exception("PROBE_EDGE_POSITION_UNAVAILABLE");placement=edge.Value;}
      if(appHwnd!=0&&!MoveWindow(new IntPtr(appHwnd),placement.X,placement.Y,placement.Width,placement.Height,true))throw new Exception("PROBE_APP_POSITION_FAILED");
      if(!hiddenApplication)app.Visible=-1;
    }
    // No external presentation is opened and no Trust Center setting is changed.
    sentinel=app.Presentations.Add(0);sentinel.Slides.Add(1,12);
    sentinelPath=Path.Combine(root,"owned-sentinel.pptx");sentinel.SaveAs(sentinelPath,24);sentinelHash=Hash(sentinelPath);
    MakeSource();
    source.SlideShowSettings.ShowType=fullscreenSource?1:2;
    if(!fullscreenSource)source.SlideShowSettings.ShowScrollbar=0;
    if(fullscreenSource)source.SlideShowSettings.ShowPresenterView=0;
    source.SlideShowSettings.AdvanceMode=2;
    source.SlideShowSettings.LoopUntilStopped=0;
    show=source.SlideShowSettings.Run();
    // HWND is a restricted COM member: call the installed typed interface, not IDispatch.
    long hwnd=(long)((Microsoft.Office.Interop.PowerPoint.SlideShowWindow)show).HWND;
    uint pid;GetWindowThreadProcessId(new IntPtr(hwnd),out pid);
    IntPtr rootWindow=GetAncestor(new IntPtr(hwnd),2);uint rootPid;GetWindowThreadProcessId(rootWindow,out rootPid);
    if(rootPid!=pid||(string)show.Presentation.FullName!=(string)source.FullName)throw new Exception("PROBE_WINDOW_OWNER_MISMATCH");
    // HWND is the child slide surface; move the owned show frame, not its child.
    int left=-2400,top=-1200,width=1920,height=1080;
    if(authorizedScreen!=null){var bounds=authorizedScreen.Bounds;left=bounds.X;top=bounds.Y;width=Math.Min(width,bounds.Width);height=Math.Min(height,bounds.Height);if(edgePosition){var screens=new System.Collections.Generic.List<System.Drawing.Rectangle>();foreach(var screen in Screen.AllScreens)screens.Add(screen.Bounds);var edge=SourcePlacement.FindEdge(bounds,screens.ToArray(),width,height,64);if(!edge.HasValue)throw new Exception("PROBE_EDGE_POSITION_UNAVAILABLE");left=edge.Value.X;top=edge.Value.Y;}}
    if(!MoveWindow(rootWindow,left,top,width,height,true))throw new Exception("PROBE_WINDOW_POSITION_FAILED");
    System.Threading.Thread.Sleep(200);
    Rect outer,inner;Point origin=new Point();
    if(!GetWindowRect(rootWindow,out outer)||!GetClientRect(new IntPtr(hwnd),out inner)||!ClientToScreen(new IntPtr(hwnd),ref origin))throw new Exception("PROBE_WINDOW_RECT_FAILED");
    show.View.State=2;
    Rect physical;
    var priorDpi=SetThreadDpiAwarenessContext(new IntPtr(-4));
    try{if(!GetWindowRect(rootWindow,out physical))throw new Exception("PROBE_PHYSICAL_RECT_FAILED");}
    finally{if(priorDpi!=IntPtr.Zero)SetThreadDpiAwarenessContext(priorDpi);}
    string createdAt;
    using(var ownerProcess=System.Diagnostics.Process.GetProcessById((int)pid)){createdAt=ownerProcess.StartTime.ToFileTimeUtc().ToString(System.Globalization.CultureInfo.InvariantCulture);}
    Emit(new {kind="ready",version=(string)app.Version,monitor=authorizedScreen==null?"offscreen":authorizedScreen.DeviceName,windowHandle=hwnd.ToString(),rootWindowHandle=rootWindow.ToInt64().ToString(),windowVisible=IsWindowVisible(new IntPtr(hwnd)),geometryDiagnostic=new{dpi=GetDpiForWindow(rootWindow),physicalWidth=physical.right-physical.left,physicalHeight=physical.bottom-physical.top},monitorBounds=authorizedScreen==null?null:new{left=authorizedScreen.Bounds.Left,top=authorizedScreen.Bounds.Top,width=authorizedScreen.Bounds.Width,height=authorizedScreen.Bounds.Height},crop=new{x=origin.x-outer.left,y=origin.y-outer.top,width=inner.right,height=inner.bottom,outerWidth=outer.right-outer.left,outerHeight=outer.bottom-outer.top},processId=pid,createdAt=createdAt,qpcFrequency=System.Diagnostics.Stopwatch.Frequency.ToString(System.Globalization.CultureInfo.InvariantCulture),status=State(),sourcePath=Path.Combine(root,"owned-source.pptx")});
  }
  static bool Cleanup(){
    bool unchanged=false;
    try{if(show!=null)show.View.Exit();}catch{}
    try{if(source!=null){source.Saved=-1;source.Close();}}catch{}
    try{if(sentinel!=null){unchanged=Hash(sentinelPath)==sentinelHash && (int)sentinel.Saved==-1;sentinel.Close();}}catch{}
    // COM may share an Office application. Never quit it with other documents open.
    try{if(app!=null && (int)app.Presentations.Count==0)app.Quit();}catch{}
    return unchanged;
  }
  [STAThread] static int Main(string[] args){
    Console.OutputEncoding=new System.Text.UTF8Encoding(false);
    Console.InputEncoding=new System.Text.UTF8Encoding(false);
    if(args.Length<1||args.Length>4)return 2;
    bool monitorRequested=false;
    for(int a=1;a<args.Length;a++){
      if(args[a]=="--monitor=1"&&!monitorRequested)monitorRequested=true;
      else if(args[a]=="--native-next"&&!nativeNext)nativeNext=true;
      else if(args[a]=="--edge"&&!edgePosition)edgePosition=true;
      else if(args[a]=="--hidden-app"&&!hiddenApplication)hiddenApplication=true;
      else if(args[a]=="--fullscreen"&&!fullscreenSource)fullscreenSource=true;
      else return 2;
    }
    if(edgePosition&&!monitorRequested)return 2;
    root=Path.GetFullPath(args[0]);
    if(!Directory.Exists(root)||!File.Exists(Path.Combine(root,".probe-owned")))return 2;
    try{
      if(monitorRequested){
        foreach(var screen in Screen.AllScreens)if(screen.DeviceName.EndsWith("DISPLAY1",StringComparison.OrdinalIgnoreCase))authorizedScreen=screen;
        if(authorizedScreen==null)throw new Exception("PROBE_MONITOR_1_NOT_FOUND");
      }
      Setup();string line;
      while((line=Console.ReadLine())!=null){
        if(line.Length>4096)throw new Exception("PROBE_COMMAND_TOO_LARGE");
        var cmd=json.Deserialize<Dictionary<string,object>>(line);
        string type=Convert.ToString(cmd["type"]),id=Convert.ToString(cmd["id"]);
        Application.DoEvents();
        if(type=="close"){Emit(new {id=id,foreignDocumentUnchanged=Cleanup()});return 0;}
        if(type=="play"||type=="resume")show.View.State=1;
        else if(type=="pause")show.View.State=2;
        else if(type=="goto"){
          int index=Convert.ToInt32(cmd["index"]);if(index<1||index>3)throw new Exception("PROBE_SLIDE_INVALID");
          show.View.GotoSlide(index,-1);
        }else if(type=="show-sentinel"){
          dynamic otherWindow=sentinel.NewWindow();
          long otherHwnd=(long)((Microsoft.Office.Interop.PowerPoint.DocumentWindow)otherWindow).HWND;
          long sourceHwnd=(long)((Microsoft.Office.Interop.PowerPoint.SlideShowWindow)show).HWND;
          Emit(new{id=id,sentinelRoot=GetAncestor(new IntPtr(otherHwnd),2).ToInt64().ToString(),sourceRoot=GetAncestor(new IntPtr(sourceHwnd),2).ToInt64().ToString(),sourceChildVisible=IsWindowVisible(new IntPtr(sourceHwnd)),status=State()});continue;
        }else if(type=="next"){
          if(nativeNext)show.View.Next();
          else{
            int index=(int)show.View.GetClickIndex(),count=(int)show.View.GetClickCount();
            if(index<count)show.View.GotoClick(index+1);
            else if((int)show.View.Slide.SlideIndex<3)show.View.GotoSlide((int)show.View.Slide.SlideIndex+1,-1);
          }
        }else if(type!="status")throw new Exception("PROBE_COMMAND_INVALID");
        Application.DoEvents();Emit(new {id=id,status=State()});
      }
      Cleanup();return 0;
    }catch(Exception error){
      Emit(new {kind="error",message=error.Message,hresult=error.HResult,foreignDocumentUnchanged=Cleanup()});return 1;
    }
  }
}
