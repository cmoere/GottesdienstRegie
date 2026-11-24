import {expect,it} from 'vitest';
import {shapeCatalog,shapeByKind,searchShapes} from './shapeCatalog';
it('offers Christmas, Easter and a distinct Christian cross as real vector shapes',()=>{
 expect(searchShapes('Weihnachten').length).toBeGreaterThanOrEqual(5);expect(searchShapes('Ostern').length).toBeGreaterThanOrEqual(4);
 for(const kind of ['christmas-star','christmas-tree','advent-wreath','nativity','christmas-bell','easter-egg','easter-tomb','palm-branch','easter-lily','latin-cross']){const shape=shapeByKind(kind);expect(shape.kind).toBe(kind);expect(shape.vector).toBe(true);expect(shape.path.length).toBeGreaterThan(35)}
 expect(new Set(shapeCatalog.filter(s=>s.vector).map(s=>s.path)).size).toBe(10);
});
