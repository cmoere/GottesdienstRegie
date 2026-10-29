import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {expect,it} from 'vitest';

it.each(['src/App.tsx','src/ProductionWorkspace.tsx','src/MediaBrowser.tsx','src/BibleTextDialog.tsx','src/AudioRoutingSettings.tsx','src/RemoteCenter.tsx','src/FileMenu.tsx','src/NowPlayingDesigner.tsx','src/BackgroundAudioPanel.tsx','src/PersonalNotesPanel.tsx','src/VideoInputSettings.tsx','src/ChangeHistoryWindow.tsx','src/TestStartDialog.tsx','src/EventSlideDesigner.tsx'])('%s keeps translated option labels independent of persisted values',filename=>{
  const source=readFileSync(filename,'utf8'),file=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const unsafe:string[]=[];
  function containsCopy(node:ts.Node):boolean{
    if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='tx')return true;
    return ts.forEachChild(node,containsCopy)??false;
  }
  function walk(node:ts.Node){
    if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(file)==='option'&&containsCopy(node)){
      const stable=node.openingElement.attributes.properties.some(attribute=>ts.isJsxAttribute(attribute)&&attribute.name.getText(file)==='value');
      if(!stable)unsafe.push(node.getText(file));
    }
    ts.forEachChild(node,walk);
  }
  walk(file);expect(unsafe).toEqual([]);
});
