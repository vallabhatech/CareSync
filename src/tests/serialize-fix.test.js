const serialize = require('serialize-javascript');

describe('serialize-javascript CPU Exhaustion Fix', () => {
    test('handles extremely large sparse arrays without CPU exhaustion', () => {
        const largeSparse = [];
        largeSparse.length = 1000000000; // 1 Billion
        largeSparse[0] = 'start';
        largeSparse[999999999] = 'end';

        const start = Date.now();
        const result = serialize(largeSparse);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(1000); // Should be very fast (< 1s)
        expect(result).toContain('Array.prototype.slice.call');
        expect(result).toContain('"0":"start"');
        expect(result).toContain('"999999999":"end"');
        expect(result).toContain('"length":1000000000');
    });

    test('preserves normal array serialization', () => {
        const normal = [1, 2, 3];
        expect(serialize(normal)).toBe('[1,2,3]');
    });

    test('preserves sparse array behavior', () => {
        const sparse = [1, , 3];
        const result = serialize(sparse);
        expect(result).toBe('Array.prototype.slice.call({"0":1,"2":3,"length":3})');
    });

    test('handles deeply nested structures', () => {
        const nested = { a: { b: { c: [1, , 3] } } };
        const result = serialize(nested);
        expect(result).toContain('Array.prototype.slice.call({"0":1,"2":3,"length":3})');
    });

    test('handles cyclic references (if supported by serialize-javascript - it usually throws)', () => {
        const a = {};
        a.self = a;
        expect(() => serialize(a)).toThrow(); // serialize-javascript doesn't handle cycles by default
    });

    test('handles pathological array-like objects with large length', () => {
        // Since we used Array.isArray, non-array objects with large length are treated as normal objects
        const arrayLike = { length: 1000000000, 0: 'a' };
        const start = Date.now();
        const result = serialize(arrayLike);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100);
        expect(result).toBe('{"0":"a","length":1000000000}');
    });

    test('handles sparse arrays with non-index properties', () => {
        const sparse = [];
        sparse.length = 5;
        sparse[1] = 'a';
        sparse.foo = 'bar';
        const result = serialize(sparse);
        // Order might vary, check for all parts
        expect(result).toContain('Array.prototype.slice.call(');
        expect(result).toContain('"1":"a"');
        expect(result).toContain('"foo":"bar"');
        expect(result).toContain('"length":5');
    });

    test('handles sparse array with undefined values', () => {
        const sparse = [1, undefined, 3];
        // serialize-javascript preserves undefined (unlike JSON.stringify)
        expect(serialize(sparse)).toContain('[1,undefined,3]');
    });

    test('handles extremely sparse array', () => {
        const sparse = [];
        sparse[1000000] = 'huge';
        const result = serialize(sparse);
        expect(result).toContain('"1000000":"huge"');
        expect(result).toContain('"length":1000001');
    });
});
