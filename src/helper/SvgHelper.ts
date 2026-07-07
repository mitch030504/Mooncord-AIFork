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

        const range = max - min || 1

        const center_x = width / 2
        const center_y = height / 2 + 20
        const scale_x = width * 0.3
        const scale_y = height * 0.3
        const scale_z = range > 0.01 ? 60 / range : 100

        const project = (col: number, row: number, z: number) => {
            const val_x = -1 + 2 * col / (cols - 1)
            const val_y = -1 + 2 * row / (rows - 1)
            const P_x = val_x * scale_x
            const P_y = val_y * scale_y
            const P_z = z * scale_z

            const x_proj = (P_x - P_y) * 0.707
            const y_proj = (P_x + P_y) * 0.3535 - P_z * 0.866

            return {
                x: center_x + x_proj,
                y: center_y - y_proj
            }
        }

        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
            s /= 100
            l /= 100
            const k = (n: number) => (n + h / 30) % 12
            const a = s * Math.min(l, 1 - l)
            const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
            return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))]
        }

        // Draw zero-level flat plane grid for reference
        for (let y = 0; y < rows; y++) {
            const pStart = project(0, y, 0)
            const pEnd = project(cols - 1, y, 0)
            arr.push(`<line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#32323a" stroke-width="1" />`)
        }
        for (let x = 0; x < cols; x++) {
            const pStart = project(x, 0, 0)
            const pEnd = project(x, rows - 1, 0)
            arr.push(`<line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#32323a" stroke-width="1" />`)
        }

        // Draw mesh quads (back-to-front depth sorting)
        for (let y = rows - 2; y >= 0; y--) {
            for (let x = 0; x < cols - 1; x++) {
                const z00 = matrix[y]![x]!
                const z10 = matrix[y + 1]![x]!
                const z11 = matrix[y + 1]![x + 1]!
                const z01 = matrix[y]![x + 1]!

                const p00 = project(x, y, z00)
                const p10 = project(x, y + 1, z10)
                const p11 = project(x + 1, y + 1, z11)
                const p01 = project(x + 1, y, z01)

                const avgZ = (z00 + z10 + z11 + z01) / 4
                const normalized = Math.max(0, Math.min(1, (avgZ - min) / range))
                const hue = 240 - (normalized * 240)
                const rgb = hslToRgb(hue, 100, 50)
                const fill = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`

                arr.push(`<polygon points="${p00.x},${p00.y} ${p10.x},${p10.y} ${p11.x},${p11.y} ${p01.x},${p01.y}" fill="${fill}" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />`)
            }
        }

        // Draw mesh grid lines on top
        for (let y = 0; y < rows; y++) {
            let path = ''
            for (let x = 0; x < cols; x++) {
                const p = project(x, y, matrix[y]![x]!)
                path += (x === 0 ? 'M' : 'L') + `${p.x},${p.y} `
            }
            arr.push(`<path d="${path}" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" fill="none" />`)
        }
        for (let x = 0; x < cols; x++) {
            let path = ''
            for (let y = 0; y < rows; y++) {
                const p = project(x, y, matrix[y]![x]!)
                path += (y === 0 ? 'M' : 'L') + `${p.x},${p.y} `
            }
            arr.push(`<path d="${path}" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" fill="none" />`)
        }

        // Add a color scale legend at the right
        const legend_x = width - 80
        const legend_y = height * 0.25
        const legend_w = 20
        const legend_h = height * 0.5

        arr.push(`<defs>
            <linearGradient id="legendGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="rgb(0,0,255)" />
                <stop offset="25%" stop-color="rgb(0,255,255)" />
                <stop offset="50%" stop-color="rgb(0,255,0)" />
                <stop offset="75%" stop-color="rgb(255,255,0)" />
                <stop offset="100%" stop-color="rgb(255,0,0)" />
            </linearGradient>
        </defs>`)

        arr.push(`<rect x="${legend_x}" y="${legend_y}" width="${legend_w}" height="${legend_h}" fill="url(#legendGrad)" stroke="#444" stroke-width="1" />`)

        // Add labels
        arr.push(`<g fill="#ffffff" font-family="sans-serif" font-size="12">
            <text x="${legend_x + 30}" y="${legend_y + 12}">${max.toFixed(2)} mm</text>
            <text x="${legend_x + 30}" y="${legend_y + legend_h / 2 + 5}">0.00 mm</text>
            <text x="${legend_x + 30}" y="${legend_y + legend_h}">${min.toFixed(2)} mm</text>
        </g>`)

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