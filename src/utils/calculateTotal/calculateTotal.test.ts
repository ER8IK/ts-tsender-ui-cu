// calculateTotal.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTotal } from './calculateTotal' // Импортируем функцию из файла

// Импортируем функцию или копируем, если она не экспортируется из файла
function calculateTotalLocal(amounts: string): number {
    const amountArray = amounts
        .split(/[\n,]+/)
        .map(amt => amt.trim())
        .filter(amt => amt !== "")
        .map(amt => parseFloat(amt))
    if (amountArray.some(isNaN)) {
        return 0
    }

    return amountArray
        .filter(num => !isNaN(num)) 
        .reduce((sum, num) => sum + num, 0);
}

describe('calculateTotal', () => {
    it('should return the correct sum for comma-separated values', () => {
        expect(calculateTotalLocal("100,200,300")).toBe(600)
    })

    it('should return the correct sum for newline-separated values', () => {
        expect(calculateTotalLocal("100\n200\n300")).toBe(600)
    })

    it('should return the correct sum for mixed commas and newlines', () => {
        expect(calculateTotalLocal("100\n200,300")).toBe(600)
    })

    it('should ignore extra whitespace', () => {
        expect(calculateTotalLocal(" 100 , 200 \n 300 ")).toBe(600)
    })

    it('should return 0 if any value is not a number', () => {
        expect(calculateTotalLocal("100,abc,300")).toBe(0)
    })

    it('should return 0 for an empty string', () => {
        expect(calculateTotalLocal("")).toBe(0)
    })

    it('should return 0 for only non-numeric values', () => {
        expect(calculateTotalLocal("abc,def")).toBe(0)
    })
})
