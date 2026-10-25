// Own diagnostic deck only. This never interprets a user's presentation.
function classifyOfficeBackground(pixels,width,height){
 if(width!==1920||height!==9||!Buffer.isBuffer(pixels)||pixels.length!==width*height*4)throw Error('OFFICE_PROOF_GEOMETRY');
 // Sample inside the slide, outside both the moving fixture marker and the
 // window's aspect-ratio padding. A black letterbox is not a black slide.
 const at=(8*width+1800)*4,color=[pixels[at+2],pixels[at+1],pixels[at]],max=Math.max(...color);
 if(pixels[at+3]<250)throw Error('OFFICE_PROOF_ALPHA');
 return max<30?0:color[0]===max?1:color[1]===max?2:3;
}
module.exports={classifyOfficeBackground};
