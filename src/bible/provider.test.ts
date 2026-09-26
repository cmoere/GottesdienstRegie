import {describe,expect,it,vi} from 'vitest';
import {chapterCountForBook,fetchBiblePassage,fetchBibleTranslations,searchBibleBooks} from './provider';

describe('Bible passage provider',()=>{
  it('loads and normalizes a selected passage for the MAIN quick action',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({luther1545_43_3:{translation:'Luther (1545)',book_name:'Johannes',chapter:3,verses:[{verse:16,text:'Also hat Gott die Welt geliebt.'},{verse:17,text:'Denn Gott sandte seinen Sohn.'}]}}),{status:200}));
    const passage=await fetchBiblePassage({translation:'luther1545',book:'John',bookLabel:'Johannes',chapter:3,fromVerse:16,toVerse:17},fetcher as typeof fetch);
    expect(fetcher).toHaveBeenCalledWith('https://query.getbible.net/v2/luther1545/John%203%3A16-17',expect.objectContaining({headers:{accept:'application/json'}}));
    expect(passage).toEqual({reference:'Johannes 3,16–17',translation:'Luther (1545)',verses:[{number:16,text:'Also hat Gott die Welt geliebt.'},{number:17,text:'Denn Gott sandte seinen Sohn.'}]});
  });

  it('reports an unavailable passage instead of showing a blank MAIN overlay',async()=>{
    const fetcher=vi.fn(async()=>new Response('{}',{status:200}));
    await expect(fetchBiblePassage({translation:'luther1545',book:'John',bookLabel:'Johannes',chapter:99,fromVerse:1,toVerse:1},fetcher as typeof fetch)).rejects.toThrow('BIBLE_PASSAGE_EMPTY');
  });

  it('suggests books by German name and common abbreviation',()=>{
    expect(searchBibleBooks('joh').slice(0,2).map(book=>book.name)).toEqual(['Johannes','1. Johannes']);
    expect(searchBibleBooks('ps').at(0)?.name).toBe('Psalmen');
  });

  it('provides valid chapter boundaries for suggestions',()=>{
    expect(chapterCountForBook('John')).toBe(21);
    expect(chapterCountForBook('Psalms')).toBe(150);
  });

  it('loads additional public translations and keeps German editions first',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({kjv:{translation:'King James Version',abbreviation:'kjv',language:'English'},luther1545:{translation:'Luther 1545',abbreviation:'luther1545',language:'German'},web:{translation:'World English Bible',abbreviation:'web',language:'English'}}),{status:200}));
    const translations=await fetchBibleTranslations(fetcher as typeof fetch);
    expect(translations.map(entry=>entry.id)).toEqual(['luther1545','kjv','web']);
  });
});
