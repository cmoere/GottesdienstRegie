using System;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;

// Private native ownership information is sent only to the trusted parent.
sealed class SourceWindow : IDisposable {
 [DllImport("user32.dll")]static extern IntPtr GetAncestor(IntPtr hwnd,uint flags);
 [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr hwnd,out uint pid);
 [DllImport("user32.dll")]static extern bool MoveWindow(IntPtr hwnd,int x,int y,int width,int height,bool repaint);
 [DllImport("user32.dll")]static extern bool GetWindowRect(IntPtr hwnd,out Rect rect);
 [DllImport("user32.dll")]static extern bool GetClientRect(IntPtr hwnd,out Rect rect);
 [DllImport("user32.dll")]static extern bool ClientToScreen(IntPtr hwnd,ref Point point);
 [DllImport("user32.dll")]static extern bool IsWindowVisible(IntPtr hwnd);
 [DllImport("user32.dll")]static extern int GetWindowLong(IntPtr hwnd,int index);
 [DllImport("user32.dll")]static extern bool SetWindowPos(IntPtr hwnd,IntPtr after,int x,int y,int width,int height,uint flags);
 [DllImport("kernel32.dll")]static extern IntPtr CreateToolhelp32Snapshot(uint flags,uint processId);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)]static extern bool Process32FirstW(IntPtr snapshot,ref ProcessEntry entry);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)]static extern bool Process32NextW(IntPtr snapshot,ref ProcessEntry entry);
 [DllImport("kernel32.dll")]static extern bool CloseHandle(IntPtr handle);
 [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)]struct ProcessEntry{public uint Size,Usage,Id;public UIntPtr Heap;public uint Module,Threads,Parent;public int Priority;public uint Flags;[MarshalAs(UnmanagedType.ByValTStr,SizeConst=260)]public string Name;}
 [DllImport("user32.dll")]static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern bool SetProp(IntPtr hwnd,string name,IntPtr value);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern IntPtr GetProp(IntPtr hwnd,string name);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]static extern IntPtr RemoveProp(IntPtr hwnd,string name);
 [StructLayout(LayoutKind.Sequential)]struct Rect {public int Left,Top,Right,Bottom;}
 sealed class CoverForm:Form{protected override bool ShowWithoutActivation{get{return true;}}}
 static Process Parent;
 public static bool ParentAlive{get{return Parent!=null&&!Parent.HasExited;}}
 public static void BindParent(){
  IntPtr snapshot=CreateToolhelp32Snapshot(2,0);if(snapshot==new IntPtr(-1))throw new InvalidOperationException("POWERPOINT_PARENT_UNAVAILABLE");
  try{var entry=new ProcessEntry();entry.Size=(uint)Marshal.SizeOf(entry);if(Process32FirstW(snapshot,ref entry))do{if(entry.Id==(uint)Process.GetCurrentProcess().Id){Parent=Process.GetProcessById((int)entry.Parent);return;}}while(Process32NextW(snapshot,ref entry));throw new InvalidOperationException("POWERPOINT_PARENT_UNAVAILABLE");}finally{CloseHandle(snapshot);}
 }
 Form Cover;IntPtr Root,Child;uint Pid;long CreatedAt;string Marker;IntPtr Cookie;
 public object Identity {get;private set;}
 public static void EnablePhysicalCoordinates(){if(SetThreadDpiAwarenessContext(new IntPtr(-4))==IntPtr.Zero)throw new InvalidOperationException("POWERPOINT_PHYSICAL_COORDINATES_UNAVAILABLE");}
 public static Rectangle ValidateBounds(HostRequest request){
  var bounds=new Rectangle(request.X,request.Y,request.Width,request.Height);
  foreach(var screen in Screen.AllScreens)if(screen.Bounds.Contains(bounds))return bounds;
  throw new InvalidOperationException("POWERPOINT_SOURCE_MONITOR_UNAVAILABLE");
 }
 public Rectangle CoverBeforeActivation(Rectangle bounds,string outputWindow){
  IntPtr output=IntPtr.Zero;
  if(outputWindow!=null){output=new IntPtr(unchecked((long)ulong.Parse(outputWindow,System.Globalization.CultureInfo.InvariantCulture)));uint owner;Rect rect;
   var root=GetAncestor(output,2);var thread=GetWindowThreadProcessId(output,out owner);var visible=IsWindowVisible(output);var topmost=(GetWindowLong(output,-20)&8)!=0;
   if(!ParentAlive||root!=output||thread==0||owner!=Parent.Id||!visible||!topmost||!GetWindowRect(output,out rect)){Console.Error.WriteLine("OUTPUT_GUARD parent="+(Parent==null?0:Parent.Id)+" owner="+owner+" root="+(root==output)+" visible="+visible+" topmost="+topmost);throw new InvalidOperationException("POWERPOINT_OUTPUT_GUARD_INVALID");}
   bounds=new Rectangle(rect.Left,rect.Top,rect.Right-rect.Left,rect.Bottom-rect.Top);if(bounds.Width<64||bounds.Height<64||bounds.Width>4096||bounds.Height>2160)throw new InvalidOperationException("POWERPOINT_SOURCE_GEOMETRY");
  }
  Cover=new CoverForm{FormBorderStyle=FormBorderStyle.None,StartPosition=FormStartPosition.Manual,Bounds=bounds,BackColor=Color.Black,ShowInTaskbar=false,TopMost=true,Opacity=output==IntPtr.Zero?1:0};Cover.Show();
  if(output!=IntPtr.Zero){if(!SetWindowPos(Cover.Handle,output,bounds.X,bounds.Y,bounds.Width,bounds.Height,0x0010))throw new InvalidOperationException("POWERPOINT_OUTPUT_GUARD_INVALID");Cover.Opacity=1;}
  Application.DoEvents();return bounds;
 }
 public static void PlaceApplication(dynamic app,Rectangle bounds){
  var hwnd=new IntPtr((long)((Microsoft.Office.Interop.PowerPoint.Application)app).HWND);
  if(hwnd==IntPtr.Zero||!MoveWindow(hwnd,bounds.X,bounds.Y,bounds.Width,bounds.Height,true))throw new InvalidOperationException("POWERPOINT_SOURCE_POSITION");
 }
 public void Bind(dynamic show,Rectangle bounds,string generation,double sourceWidth,double sourceHeight){
  Child=new IntPtr((long)((Microsoft.Office.Interop.PowerPoint.SlideShowWindow)show).HWND);Root=GetAncestor(Child,2);
  uint childPid;GetWindowThreadProcessId(Root,out Pid);GetWindowThreadProcessId(Child,out childPid);
  if(Pid==0||Pid!=childPid||Root==IntPtr.Zero||Root==Child)throw new InvalidOperationException("POWERPOINT_SOURCE_OWNER");
  using(var process=Process.GetProcessById((int)Pid)){CreatedAt=process.StartTime.ToFileTimeUtc();}
  if(!MoveWindow(Root,bounds.X,bounds.Y,bounds.Width,bounds.Height,true))throw new InvalidOperationException("POWERPOINT_SOURCE_POSITION");
  Application.DoEvents();Rect outer,inner;
  if(!GetWindowRect(Root,out outer)||!GetClientRect(Child,out inner))throw new InvalidOperationException("POWERPOINT_SOURCE_GEOMETRY");
  int insetW=(outer.Right-outer.Left)-inner.Right,insetH=(outer.Bottom-outer.Top)-inner.Bottom;
  double scale=Math.Min((bounds.Width-insetW)/sourceWidth,(bounds.Height-insetH)/sourceHeight);
  int width=(int)Math.Floor(sourceWidth*scale),height=(int)Math.Floor(sourceHeight*scale);
  if(width<64||height<64||insetW<0||insetH<0)throw new InvalidOperationException("POWERPOINT_SOURCE_GEOMETRY");
  int frameW=width+insetW,frameH=height+insetH;
  if(!MoveWindow(Root,bounds.X+(bounds.Width-frameW)/2,bounds.Y+(bounds.Height-frameH)/2,frameW,frameH,true))throw new InvalidOperationException("POWERPOINT_SOURCE_POSITION");
  Application.DoEvents();Point origin=new Point();
  if(!GetWindowRect(Root,out outer)||!GetClientRect(Child,out inner)||!ClientToScreen(Child,ref origin))throw new InvalidOperationException("POWERPOINT_SOURCE_GEOMETRY");
  Marker="GDR.PowerPoint."+generation;Cookie=new IntPtr(Process.GetCurrentProcess().Id);
  if(!SetProp(Root,Marker,Cookie)||!SetProp(Child,Marker,Cookie))throw new InvalidOperationException("POWERPOINT_SOURCE_MARKER");
  if(!Valid())throw new InvalidOperationException("POWERPOINT_SOURCE_OWNER");
  Identity=new{rootWindowHandle=Root.ToInt64().ToString(),childWindowHandle=Child.ToInt64().ToString(),processId=Pid,createdAt=CreatedAt.ToString(System.Globalization.CultureInfo.InvariantCulture),lifetimeProperty=Marker,lifetimeValue=Cookie.ToInt64().ToString(),crop=new{x=origin.X-outer.Left,y=origin.Y-outer.Top,width=inner.Right,height=inner.Bottom,outerWidth=outer.Right-outer.Left,outerHeight=outer.Bottom-outer.Top}};
 }
 public bool Valid(){
  if(Root==IntPtr.Zero||Child==IntPtr.Zero||Marker==null||GetProp(Root,Marker)!=Cookie||GetProp(Child,Marker)!=Cookie||GetAncestor(Child,2)!=Root||!IsWindowVisible(Child))return false;
  uint rootPid,childPid;GetWindowThreadProcessId(Root,out rootPid);GetWindowThreadProcessId(Child,out childPid);if(rootPid!=Pid||childPid!=Pid)return false;
  try{using(var process=Process.GetProcessById((int)Pid))return process.StartTime.ToFileTimeUtc()==CreatedAt;}catch{return false;}
 }
 public void Revoke(){
  if(Marker!=null){if(GetProp(Child,Marker)==Cookie)RemoveProp(Child,Marker);if(GetProp(Root,Marker)==Cookie)RemoveProp(Root,Marker);}
 }
 public void Dispose(){
  Revoke();
  Child=Root=IntPtr.Zero;Identity=null;if(Cover!=null){Cover.Close();Cover.Dispose();Cover=null;}
 }
}
