using System;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;

public sealed class HostRequest {
 public long Id;public string Op,Session,Generation,SourcePath,SourceHash,OutputWindowHandle;public int SlideId,X,Y,Width,Height;
}
public static class HostContract {
 static Exception Invalid(){return new InvalidDataException("POWERPOINT_HOST_PROTOCOL");}
 static string Text(Dictionary<string,object> data,string key,string pattern){object value;if(!data.TryGetValue(key,out value)||!(value is string)||!Regex.IsMatch((string)value,pattern))throw Invalid();return(string)value;}
 static long Integer(Dictionary<string,object> data,string key,long minimum,long maximum){
  object value;if(!data.TryGetValue(key,out value)||!(value is int||value is long||value is decimal||value is double))throw Invalid();
  decimal number;try{number=Convert.ToDecimal(value,System.Globalization.CultureInfo.InvariantCulture);}catch{throw Invalid();}
  if(number<minimum||number>maximum||decimal.Truncate(number)!=number)throw Invalid();return(long)number;
 }
 static void Exact(Dictionary<string,object> data,string[] keys){if(data.Count!=keys.Length)throw Invalid();foreach(string key in keys)if(!data.ContainsKey(key))throw Invalid();}
 public static HostRequest Parse(string line){
  if(string.IsNullOrEmpty(line)||line.Length>65536||line.IndexOf('\0')>=0)throw Invalid();
  var serializer=new JavaScriptSerializer();serializer.MaxJsonLength=65536;serializer.RecursionLimit=8;
  var data=serializer.DeserializeObject(line) as Dictionary<string,object>;if(data==null)throw Invalid();
  var request=new HostRequest();request.Id=Integer(data,"id",1,9007199254740991L);request.Op=Text(data,"op","^[a-z-]{1,20}$");request.Session=Text(data,"session","^[a-f0-9]{32}$");request.Generation=Text(data,"generation","^[a-f0-9]{32}$");
  if(request.Op=="prepare"){
   Exact(data,new[]{"id","op","session","generation","sourceHash","sourcePath","bounds"});
   request.SourceHash=Text(data,"sourceHash","^[a-f0-9]{64}$");request.SourcePath=Text(data,"sourcePath","^[^\\x00-\\x1f]{1,4096}$");
   if(!Path.IsPathRooted(request.SourcePath)||request.SourcePath.StartsWith("\\\\",StringComparison.Ordinal)||request.SourcePath.IndexOf('/')>=0)throw Invalid();
   string full=Path.GetFullPath(request.SourcePath);
   if(!string.Equals(full,request.SourcePath,StringComparison.OrdinalIgnoreCase)||!string.Equals(Path.GetFileName(full),request.SourceHash+".pptx",StringComparison.Ordinal)||!string.Equals(Path.GetFileName(Path.GetDirectoryName(full)),"powerpoint-sources",StringComparison.OrdinalIgnoreCase))throw Invalid();
   var bounds=data["bounds"] as Dictionary<string,object>;if(bounds==null)throw Invalid();Exact(bounds,new[]{"x","y","width","height"});request.X=(int)Integer(bounds,"x",-100000,100000);request.Y=(int)Integer(bounds,"y",-100000,100000);request.Width=(int)Integer(bounds,"width",64,4096);request.Height=(int)Integer(bounds,"height",64,2160);
  }else if(request.Op=="begin"&&data.ContainsKey("outputWindowHandle")){
   Exact(data,new[]{"id","op","session","generation","outputWindowHandle"});request.OutputWindowHandle=Text(data,"outputWindowHandle","^[1-9][0-9]{0,19}$");ulong handle;if(!ulong.TryParse(request.OutputWindowHandle,out handle)||handle==0)throw Invalid();
  }else if(request.Op=="goto"){
   Exact(data,new[]{"id","op","session","generation","slideId"});request.SlideId=(int)Integer(data,"slideId",1,int.MaxValue);
  }else{
   if(Array.IndexOf(new[]{"play","pause","next","previous","status","close","begin"},request.Op)<0)throw Invalid();Exact(data,new[]{"id","op","session","generation"});
  }
  return request;
 }
}
