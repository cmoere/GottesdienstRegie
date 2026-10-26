using System;using System.IO;using System.Text;using System.Text.RegularExpressions;using System.Runtime.InteropServices;using Microsoft.Win32.SafeHandles;
static class SourceSecurity {
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]static extern SafeFileHandle CreateFileW(string name,uint access,uint share,IntPtr security,uint creation,uint flags,IntPtr template);
 public static void CheckText(string text){
  if(text==null)return;if(text.Length>8192)throw new InvalidDataException("POWERPOINT_SOURCE_SECURITY_INVALID");bool section=false;int zone=-1;
  foreach(string raw in text.TrimStart('\uFEFF').Split(new[]{'\r','\n'},StringSplitOptions.RemoveEmptyEntries)){string line=raw.Trim();if(line.StartsWith("[",StringComparison.Ordinal)){section=line.Equals("[ZoneTransfer]",StringComparison.OrdinalIgnoreCase);continue;}if(section&&Regex.IsMatch(line,"^ZoneId\\s*=",RegexOptions.IgnoreCase)){var match=Regex.Match(line,"^ZoneId\\s*=\\s*([0-4])\\s*$",RegexOptions.IgnoreCase);if(!match.Success)throw new InvalidDataException("POWERPOINT_SOURCE_SECURITY_INVALID");zone=Math.Max(zone,int.Parse(match.Groups[1].Value,System.Globalization.CultureInfo.InvariantCulture));}}
  if(zone<0)throw new InvalidDataException("POWERPOINT_SOURCE_SECURITY_INVALID");if(zone>=3)throw new InvalidDataException("POWERPOINT_PROTECTED_VIEW_REQUIRED");
 }
 public static void CheckFile(string path){
  // The framework's legacy path parser rejects ADS syntax. Use a read-only
  // native handle, not a path-policy switch or a change to the source marker.
  using(var handle=CreateFileW(path+":Zone.Identifier",0x80000000,1,IntPtr.Zero,3,0,IntPtr.Zero)){
   if(handle.IsInvalid){int error=Marshal.GetLastWin32Error();if(error==2)return;throw new InvalidDataException("POWERPOINT_SOURCE_SECURITY_INVALID");}
   using(var input=new FileStream(handle,FileAccess.Read)){byte[] bytes=new byte[8193];int count=0,next;while(count<bytes.Length&&(next=input.Read(bytes,count,bytes.Length-count))>0)count+=next;if(count>8192)throw new InvalidDataException("POWERPOINT_SOURCE_SECURITY_INVALID");bool unicode=count>=2&&bytes[0]==255&&bytes[1]==254;CheckText(unicode?Encoding.Unicode.GetString(bytes,2,count-2):Encoding.UTF8.GetString(bytes,0,count));}
  }
 }
}
