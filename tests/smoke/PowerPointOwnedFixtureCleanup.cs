using System;using System.IO;using System.Diagnostics;using System.Runtime.InteropServices;using Microsoft.Office.Interop.PowerPoint;
// Test-only recovery after deliberately crashing our helper. Never packaged.
static class OwnedFixtureCleanup {
 [DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr window,out uint process);
 [STAThread]static int Main(string[] args){
  if(args.Length!=3)return 2;int id=int.Parse(args[0]);long started=long.Parse(args[1]);string file=Path.GetFullPath(args[2]),folder=Path.GetDirectoryName(Path.GetDirectoryName(file));
  if(!File.Exists(Path.Combine(folder,".probe-owned"))||Path.GetFileName(Path.GetDirectoryName(file))!="powerpoint-sources")return 2;
  try{using(var process=Process.GetProcessById(id))if(process.StartTime.ToFileTimeUtc()!=started)return 3;}catch(ArgumentException){return 0;}
  Application office=null;
  try{office=(Application)Marshal.GetActiveObject("PowerPoint.Application");uint owner;GetWindowThreadProcessId(new IntPtr(office.HWND),out owner);
   if(owner!=id||office.ProtectedViewWindows.Count!=0||office.Presentations.Count>1)return 4;
   if(office.Presentations.Count==1){dynamic document=office.Presentations[1];try{if(!string.Equals((string)document.FullName,file,StringComparison.OrdinalIgnoreCase))return 5;document.Saved=-1;document.Close();}finally{Marshal.FinalReleaseComObject(document);}}
   if(office.Presentations.Count==0&&office.ProtectedViewWindows.Count==0){office.Quit();using(var process=Process.GetProcessById(id)){if(!process.WaitForExit(3000)&&process.StartTime.ToFileTimeUtc()==started&&process.MainWindowTitle=="")process.Kill();}}return 0;
  }finally{if(office!=null)Marshal.FinalReleaseComObject(office);}
 }
}
