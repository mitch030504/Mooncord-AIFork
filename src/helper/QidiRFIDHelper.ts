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

    public static readonly COLOR_CODES: Record<number, { hex: string, name: string, emoji: string }> = {
        1: { hex: '#FAFAFA', name: 'White', emoji: '⚪' },
        2: { hex: '#060606', name: 'Black', emoji: '⚫' },
        3: { hex: '#D9E3ED', name: 'Light Gray', emoji: '⚪' },
        4: { hex: '#5CF30F', name: 'Light Green', emoji: '🟢' },
        5: { hex: '#EB0829', name: 'Red', emoji: '🔴' },
        6: { hex: '#F0E610', name: 'Yellow', emoji: '🟡' },
        7: { hex: '#002EE6', name: 'Blue', emoji: '🔵' },
        8: { hex: '#FF8800', name: 'Orange', emoji: '🟠' },
        9: { hex: '#E709E3', name: 'Pink', emoji: '🌸' },
        10: { hex: '#2A9A09', name: 'Green', emoji: '🟢' },
        11: { hex: '#6D2C04', name: 'Brown', emoji: '🟤' },
        12: { hex: '#949494', name: 'Silver', emoji: '⚪' },
        13: { hex: '#C79D13', name: 'Gold', emoji: '🟡' },
        14: { hex: '#FDFDFC', name: 'Transparent', emoji: '💎' },
        15: { hex: '#5E5E5E', name: 'Dark Gray', emoji: '⚫' },
        16: { hex: '#B87333', name: 'Copper', emoji: '🟤' },
        17: { hex: '#556B2F', name: 'Olive', emoji: '🟢' },
        18: { hex: '#4B5320', name: 'Army Green', emoji: '🟢' },
        19: { hex: '#00008B', name: 'Dark Blue', emoji: '🔵' },
        20: { hex: '#8B0000', name: 'Dark Red', emoji: '🔴' },
        21: { hex: '#006400', name: 'Dark Green', emoji: '🟢' },
        22: { hex: '#FF8C00', name: 'Dark Orange', emoji: '🟠' },
        23: { hex: '#4B0082', name: 'Dark Purple', emoji: '🟣' },
        24: { hex: '#FF1493', name: 'Dark Pink', emoji: '🔴' }
    };

    public static getMaterial(code: number): string {
        return this.MATERIAL_CODES[code] || `Unknown (${code})`;
    }

    public static getColor(code: number): string {
        const color = this.COLOR_CODES[code];
        return color ? color.name : `Unknown (${code})`;
    }

    public static getHex(code: number): string {
        const color = this.COLOR_CODES[code];
        return color ? color.hex : '#000000';
    }

    public static getEmoji(code: number): string {
        const color = this.COLOR_CODES[code];
        return color ? color.emoji : '🟤';
    }

    public static getClosestColorEmoji(hex: string): string {
        if (!hex) return '🟤';
        // Normalize hex
        const cleanHex = hex.replace('#', '');
        if (cleanHex.length !== 6) return '🟤';
        
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        
        let closestEmoji = '🟤';
        let minDistance = Infinity;
        
        for (const code of Object.keys(this.COLOR_CODES)) {
            const entry = this.COLOR_CODES[Number(code)];
            if (!entry) continue;
            const entryHex = entry.hex.replace('#', '');
            const er = parseInt(entryHex.substring(0, 2), 16);
            const eg = parseInt(entryHex.substring(2, 4), 16);
            const eb = parseInt(entryHex.substring(4, 6), 16);
            
            const dist = Math.sqrt(
                Math.pow(r - er, 2) + 
                Math.pow(g - eg, 2) + 
                Math.pow(b - eb, 2)
            );
            
            if (dist < minDistance) {
                minDistance = dist;
                closestEmoji = entry.emoji;
            }
        }
        
        return closestEmoji;
    }
}
