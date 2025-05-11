export function calculateTotal(amounts: string): number {
    // Split the amounts string by commas and convert to numbers
    const amountArray = amounts
        .split(/[\n,]+/) // Split by new line or comma
        .map(amt => amt.trim()) // remove whitespace
        .filter(amt => amt !== "") // filter out empty strings
        .map(amt => parseFloat(amt)); // Convert to numbers
    if (amountArray.some(isNaN)) {
        return 0
    }

    // Sum all valid numbers (filter out NaN values)
    return amountArray
        .filter(num => !isNaN(num)) 
        .reduce((sum, num) => sum + num, 0);
}