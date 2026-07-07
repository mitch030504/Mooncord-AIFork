export class QidiRFIDHelper {
    public static readonly MATERIAL_CODES: Record<number, string> = {
        1: 'PLA',
        2: 'PLA Matte',
        3: 'PLA Metal',
        4: 'PLA Silk',
        5: 'PLA-CF',
        6: 'PLA-Wood',
        7: 'PLA Basic',
        8: 'PLA Matte Basic',
        11: 'ABS',
        12: 'ABS-GF',
        13: 'ABS-Metal',
        14: 'ABS-Odorless',
        18: 'ASA',
        19: 'ASA-AERO',
        24: 'UltraPA',
        25: 'PA-CF',
        26: 'UltraPA-CF25',
        27: 'PA12-CF',
        30: 'PAHT-CF',
        31: 'PAHT-GF',
        32: 'Support For PAHT',
        33: 'Support For PET/PA',
        34: 'PC/ABS-FR',
        37: 'PET-CF',
        38: 'PET-GF',
        39: 'PETG Basic',
        40: 'PETG Tough',
        41: 'PETG Rapido',
        42: 'PETG-CF',
        43: 'PETG-GF',
        44: 'PPS-CF',
        45: 'PETG Translucent',
        47: 'PVA',
        49: 'TPU-Aero',
        50: 'TPU'
    };

    public static readonly COLOR_CODES: Record<number, { hex: string, name: string }> = {
        1: { hex: '#FAFAFA', name: 'White' },
        2: { hex: '#060606', name: 'Black' },
        3: { hex: '#D9E3ED', name: 'Light Gray' },
        4: { hex: '#5CF30F', name: 'Light Green' },
        5: { hex: '#EB0829', name: 'Red' },
        6: { hex: '#F0E610', name: 'Yellow' },
        7: { hex: '#002EE6', name: 'Blue' },
        8: { hex: '#FF8800', name: 'Orange' },
        9: { hex: '#E709E3', name: 'Pink' },
        10: { hex: '#2A9A09', name: 'Green' },
        11: { hex: '#6D2C04', name: 'Brown' },
        12: { hex: '#949494', name: 'Silver' },
        13: { hex: '#C79D13', name: 'Gold' },
        14: { hex: '#FDFDFC', name: 'Transparent' },
        15: { hex: '#5E5E5E', name: 'Dark Gray' },
        16: { hex: '#B87333', name: 'Copper' },
        17: { hex: '#556B2F', name: 'Olive' },
        18: { hex: '#4B5320', name: 'Army Green' },
        19: { hex: '#00008B', name: 'Dark Blue' },
        20: { hex: '#8B0000', name: 'Dark Red' },
        21: { hex: '#006400', name: 'Dark Green' },
        22: { hex: '#FF8C00', name: 'Dark Orange' },
        23: { hex: '#4B0082', name: 'Dark Purple' },
        24: { hex: '#FF1493', name: 'Dark Pink' }
    };

    public static getMaterial(code: number): string {
        return this.MATERIAL_CODES[code] || `Unknown Material (${code})`;
    }

    public static getColor(code: number): string {
        const color = this.COLOR_CODES[code];
        return color ? color.name : `Unknown Color (${code})`;
    }

    public static getHex(code: number): string {
        const color = this.COLOR_CODES[code];
        return color ? color.hex : '#000000';
    }
}
