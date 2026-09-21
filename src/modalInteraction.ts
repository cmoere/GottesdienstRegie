export function modalBlocksCanvas(root:Pick<Document,'querySelector'>=document){
  return Boolean(root.querySelector('[aria-modal="true"]'));
}
