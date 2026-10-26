using System;using System.IO;using System.Collections.Generic;using System.Web.Script.Serialization;
class HostContractTests {
 static int checks;
 static void Assert(bool condition){checks++;if(!condition)throw new Exception("HOST_CONTRACT_ASSERT");}
 static void Reject(string json){bool rejected=false;try{HostContract.Parse(json);}catch{rejected=true;}Assert(rejected);}
 static int Main(){
  var serializer=new JavaScriptSerializer();string id=new string('a',64),session=new string('b',32),generation=new string('c',32),source=Path.Combine(Path.GetTempPath(),"regie-test","powerpoint-sources",id+".pptx");
  var prepare=new Dictionary<string,object>{{"id",1},{"op","prepare"},{"session",session},{"generation",generation},{"sourceHash",id},{"sourcePath",source},{"bounds",new Dictionary<string,object>{{"x",0},{"y",0},{"width",1920},{"height",1080}}}};
  var parsed=HostContract.Parse(serializer.Serialize(prepare));Assert(parsed.Op=="prepare"&&parsed.SourceHash==id&&parsed.SourcePath==Path.GetFullPath(source));
  foreach(string op in new[]{"play","pause","next","previous","status","close","begin"}){var cmd=new Dictionary<string,object>{{"id",2},{"op",op},{"session",session},{"generation",generation}};Assert(HostContract.Parse(serializer.Serialize(cmd)).Op==op);}
  var go=new Dictionary<string,object>{{"id",3},{"op","goto"},{"session",session},{"generation",generation},{"slideId",256}};Assert(HostContract.Parse(serializer.Serialize(go)).SlideId==256);
  var guardedBegin=new Dictionary<string,object>{{"id",2},{"op","begin"},{"session",session},{"generation",generation},{"outputWindowHandle","123"}};Assert(HostContract.Parse(serializer.Serialize(guardedBegin)).Op=="begin");guardedBegin["outputWindowHandle"]="0";Reject(serializer.Serialize(guardedBegin));guardedBegin["outputWindowHandle"]="C:\\external";Reject(serializer.Serialize(guardedBegin));
  foreach(object bad in new object[]{0,-1,1.5,"2",true}){go["id"]=bad;Reject(serializer.Serialize(go));}go["id"]=3;go["slideId"]=0;Reject(serializer.Serialize(go));go["slideId"]=256;go["path"]="C:\\external";Reject(serializer.Serialize(go));
  prepare["sourcePath"]=Path.Combine(Path.GetTempPath(),"outside.pptx");Reject(serializer.Serialize(prepare));prepare["sourcePath"]=source;prepare["generation"]="unknown";Reject(serializer.Serialize(prepare));prepare["generation"]=generation;prepare["extra"]=true;Reject(serializer.Serialize(prepare));
  Reject(new string('x',65537));Reject("{}");Reject("[]");
  SourceSecurity.CheckText(null);SourceSecurity.CheckText("[ZoneTransfer]\r\nZoneId=2\r\n");
  foreach(string marked in new[]{"[ZoneTransfer]\nZoneId=3","[Other]\nZoneId=0\n[ZoneTransfer]\nZoneId=4","[ZoneTransfer]\nZoneId=0\nZoneId=3","[ZoneTransfer]\nZoneId=5"}){bool blocked=false;try{SourceSecurity.CheckText(marked);}catch(InvalidDataException){blocked=true;}Assert(blocked);}
  Console.WriteLine("HOST_CONTRACT_PASS "+checks);return 0;
 }
}
