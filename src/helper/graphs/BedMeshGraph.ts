'use strict'

import {logRegular} from "../LoggerHelper";
import SvgHelper from "../SvgHelper";
import BaseGraph from "./BaseGraph";

export default class BedMeshGraph extends BaseGraph {
    filename = 'bedmeshGraph.png'

    public async renderGraph(matrix: number[][], min: number, max: number) {
        const svgHelper = new SvgHelper()
        logRegular('render bed mesh graph...')

        const resWidth = 600
        const resHeight = 600

        const rects = svgHelper.calculateHeatmap(matrix, min, max, resWidth, resHeight)

        let svg = `<svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 ${resWidth} ${resHeight}">
        `

        for (const rect of rects) {
            svg = `${svg}\n${rect}`
        }

        svg = `${svg}\n</svg>`

        return await this.convertSvg(svg)
    }
}
