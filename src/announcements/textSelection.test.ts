import {describe,expect,it} from 'vitest';
import {selectSpeechText} from './textSelection';

const message={messageId:'-speech',titel:'Öffentliche Überschrift',beschreibung:'Nicht ungeprüft sprechen',textDurchsageSaalscreen:'Fertig vorbereiteter Saaltext'};

describe('verified admin-meldungen speech text selection',()=>{
  it.each(['title_description','description','title'])('uses the saved effective text for %s',mode=>{
    expect(selectSpeechText({...message,durchsageTextModeSaalscreen:mode})).toEqual({text:'Fertig vorbereiteter Saaltext'});
  });
  it('manualTextOverridesGeneratedModes as on the existing writing side',()=>{
    expect(selectSpeechText({...message,durchsageTextModeSaalscreen:'title',textDurchsageManual:'Individuelle Ansage'})).toEqual({text:'Individuelle Ansage'});
  });
  it('unknownModeIsNotSpoken even when both text fields exist',()=>{
    expect(selectSpeechText({...message,durchsageTextModeSaalscreen:'unbekannt',textDurchsageManual:'Manuell'})).toHaveProperty('reason');
    expect(selectSpeechText({...message,durchsageTextModeSaalscreen:{bad:true}})).toHaveProperty('reason');
  });
  it('supports the writer nested mode precedence without falling through an unknown explicit value',()=>{
    expect(selectSpeechText({...message,durchsageTextMode:{saalscreen:'description'},durchsageTextModeSaalscreen:'unbekannt'})).toEqual({text:'Fertig vorbereiteter Saaltext'});
    expect(selectSpeechText({...message,durchsageTextMode:{saalscreen:'unbekannt'},durchsageTextModeSaalscreen:'title'})).toHaveProperty('reason');
  });
  it('missingModeUsesHallThenManual for compatible records',()=>{
    expect(selectSpeechText(message)).toEqual({text:'Fertig vorbereiteter Saaltext'});
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'',textDurchsageManual:'Nur manuell'})).toEqual({text:'Nur manuell'});
  });
  it('never reconstructs the announcement from general title or description',()=>{
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'',durchsageTextModeSaalscreen:'title_description'})).toHaveProperty('reason');
    expect(selectSpeechText({...message,textDurchsageSaalscreen:{text:'Objekt'}})).toHaveProperty('reason');
  });
  it('richTextBecomesPlainParagraphs with umlauts and safe text',()=>{
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'<p>Ältere &amp; Jüngere</p><p>Bitte <strong>kommen</strong>.</p>'})).toEqual({text:'Ältere & Jüngere\nBitte kommen.'});
  });
  it('hostileMarkupAndZeroWidthOnlyAreNotSpoken',()=>{
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'<script>bad()</script><iframe>secret</iframe><svg>hidden</svg>&#8203;\uFEFF'})).toHaveProperty('reason');
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'Bitte [[ phonemes ]] kommen\u0000.'})).toEqual({text:'Bitte phonemes kommen.'});
  });
  it('rejects oversized input instead of truncating and counts Unicode code points',()=>{
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'ü'.repeat(10_001)})).toHaveProperty('reason');
    expect(selectSpeechText({...message,textDurchsageSaalscreen:'😀'.repeat(10_000)})).toEqual({text:'😀'.repeat(10_000)});
  });
});
