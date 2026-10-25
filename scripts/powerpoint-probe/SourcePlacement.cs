using System;
using System.Drawing;

// Pure placement calculation; it never moves or enumerates somebody's window.
public static class SourcePlacement {
  static bool Valid(Rectangle r){return r.Width>0&&r.Height>0&&r.Width<=32768&&r.Height<=32768&&Math.Abs((long)r.Left)<=100000&&Math.Abs((long)r.Top)<=100000;}
  public static Rectangle? FindEdge(Rectangle target,Rectangle[] screens,int width,int height,int inset){
    if(!Valid(target)||screens==null||screens.Length==0||screens.Length>32||width<64||width>4096||height<64||height>2160||inset<1||inset>128||inset>Math.Min(width,height)||inset>Math.Min(target.Width,target.Height))return null;
    bool known=false;foreach(var screen in screens){if(!Valid(screen))return null;if(screen==target)known=true;}if(!known)return null;
    var candidates=new[]{new Rectangle(target.Left-width+inset,target.Top-height+inset,width,height),new Rectangle(target.Right-inset,target.Top-height+inset,width,height),new Rectangle(target.Left-width+inset,target.Bottom-inset,width,height),new Rectangle(target.Right-inset,target.Bottom-inset,width,height)};
    foreach(var candidate in candidates){bool safe=true;foreach(var screen in screens){if(screen==target)continue;var overlap=Rectangle.Intersect(candidate,screen);if(overlap.Width>0&&overlap.Height>0){safe=false;break;}}if(safe)return candidate;}
    return null;
  }
}
