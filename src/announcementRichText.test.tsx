import {describe,it,expect} from 'vitest';
import {render} from '@testing-library/react';
import {AnnouncementRichText} from './AnnouncementRichTextRenderer';
import {announcementRuns,announcementRunsText,readAnnouncementRichLines} from './announcementRichText';

describe('safe announcement rich text',()=>{
 it('decodes imported HTML entities even when the text contains no tags',()=>{
  expect(announcementRunsText(announcementRuns('Hallo &amp; willkommen &#252;berall'))).toBe('Hallo & willkommen überall');
 });
 it('renders literal text and the allowed styles without interpreting attributes or encoded markup',()=>{
  const runs=announcementRuns('<p><strong onclick="evil()">Bold</strong> <em>Italic</em> <u>Under</u> &lt;img src=x&gt;</p><p></p><p>After</p><iframe>private</iframe><svg><text>hidden</text></svg>');
  expect(announcementRunsText(runs)).toBe('Bold Italic Under <img src=x>\n\nAfter');
  const {container}=render(<AnnouncementRichText value={JSON.stringify([[...runs]])} text="fallback"/>);
  expect(container.textContent).toBe('Bold Italic Under <img src=x>\n\nAfter');
  expect(container.querySelector('img,iframe,svg,[onclick]')).toBeNull();
  expect(container.querySelector('span')?.style.fontWeight).toBe('700');
 });
 it('keeps blank line boxes and displays malformed persisted rich text as plain fallback',()=>{
  const {container,rerender}=render(<AnnouncementRichText value='[[{"text":"First"}],[],[{"text":"Last","italic":true,"underline":true,"onclick":"evil()"}]]' text="fallback"/>);
  expect(container.children).toHaveLength(3);
  expect(container.children[1].textContent).toBe('\u00a0');
  expect((container.children[1] as HTMLElement).style.height).toBe('1lh');
  expect(container.querySelectorAll('span')[1].style.fontStyle).toBe('italic');
  expect(container.querySelectorAll('span')[1].style.textDecoration).toBe('underline');
  expect(readAnnouncementRichLines('[[{"text":1}]]')).toBeNull();
  rerender(<AnnouncementRichText value='not JSON' text='<b>fallback</b>'/>);
  expect(container.textContent).toBe('<b>fallback</b>');
  expect(container.querySelector('b')).toBeNull();
 });
});
