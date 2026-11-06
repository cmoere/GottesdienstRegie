import QRCode from 'qrcode';

export function qrImage(reference:string):string{
  const {modules}=QRCode.create(reference),size=modules.size;
  const cells:string[]=[];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(modules.get(y,x))cells.push(`M${x+4},${y+4}h1v1h-1z`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size+8} ${size+8}"><path fill="white" d="M0 0h${size+8}v${size+8}H0z"/><path fill="black" d="${cells.join('')}"/></svg>`)}`;
}
