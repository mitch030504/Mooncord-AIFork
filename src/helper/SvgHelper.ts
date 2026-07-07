'use strict'

export default class SvgHelper {
    public calculateDonut(cx: any, cy: any, radius: any, strokeWidth: any, data: any) {
        const startAngle = -90

        const dataLength = data.length
        const arr = []

        let filled = 0
        let total = 0

        for (let i = 0; i < dataLength; i++) {
            total += data[i].value;
        }

        for (let i = 0; i < dataLength; i++) {
            const item = data[i]
            const fill = (100 / total) * item.value
            const dashArray = 2 * Math.PI * radius
            const dashOffset = dashArray - (dashArray * fill / 100)
            const angle = (filled * 360 / 100) + startAngle

            arr.push(`<circle r="${radius}" cx="${cx}" cy="${cy}" fill="transparent" stroke="${item.color}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" transform="rotate(${angle} ${cx} ${cy})"></circle>`)

            filled += fill
        }

        return arr;
    }

    public calculateHeatmap(matrix: number[][], min: number, max: number, width: number, height: number): string[] {
        const arr: string[] = []
        const rows = matrix.length
        if (rows === 0) return arr
        const cols = matrix[0]!.length
        if (cols === 0) return arr

        const cellWidth = width / cols
        const cellHeight = height / rows
        const range = max - min || 1

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const val = matrix[y]![x]!
                const normalized = Math.max(0, Math.min(1, (val - min) / range))
                const hue = 240 - (normalized * 240)
                const color = `hsl(${hue}, 100%, 50%)`

                arr.push(`<rect x="${x * cellWidth}" y="${(rows - 1 - y) * cellHeight}" width="${cellWidth + 0.5}" height="${cellHeight + 0.5}" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"></rect>`)
            }
        }
        return arr
    }

    public convertToCoords(values: [], max: number, offsetHeight = 400, resHeight = 600) {
        const coords = []
        let widthIndex = 0

        if (values === undefined) {
            return
        }

        for (const value of values) {
            coords.push(`${widthIndex},${resHeight - 10 - ((((value * 100) / max) / 100) * offsetHeight)}`)
            widthIndex++
        }

        return coords
    }

    public generateIntervalsOf(interval: any, start: any, end: any) {
        const result = [];
        let current = start;

        while (current < end) {
            result.push(current);
            current += interval;
        }

        return result;
    }
}