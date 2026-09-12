let SWAS_MASKS = [24804541, 30604951];

let PLOT_SIZE_XZ = 101;
let PLOT_SIZE_Y = 102; // idk why it's 1 block higher on y axis

// the bottom right block of a hypixel plot doesn't start at (0, 0, 0). this is to align all coordinates.
let OFFSET_X = 53;
let OFFSET_Y = -94;
let OFFSET_Z = 38;

// stores whether or not there's a block at this index (packed coordinate)
let blocks = new Uint8Array(PLOT_SIZE_XZ * PLOT_SIZE_Y * PLOT_SIZE_XZ);

function coordsToIndex(x, y, z) {
    if (x < 0 || x >= PLOT_SIZE_XZ) return -1;
    if (y < 0 || y >= PLOT_SIZE_Y) return -1;
    if (z < 0 || z >= PLOT_SIZE_XZ) return -1;

    let index = (x * PLOT_SIZE_XZ * PLOT_SIZE_Y) + (y * PLOT_SIZE_XZ) + z;

    return index;
}

function indexToCoords(index) {
    let x = Math.floor(index / (PLOT_SIZE_XZ * PLOT_SIZE_Y));
    let remainder = index % (PLOT_SIZE_XZ * PLOT_SIZE_Y);
    let y = Math.floor(remainder / PLOT_SIZE_XZ);
    let z = remainder % PLOT_SIZE_XZ;

    return { x, y, z };
}

register('packetReceived', (packet, event) => {
    let name = packet.getState().getBlock().getTranslationKey();

    let pos = packet.getPos();
    let x = pos.getX();
    let y = pos.getY();
    let z = pos.getZ();
    let index = coordsToIndex(x + OFFSET_X, y + OFFSET_Y, z + OFFSET_Z);

    if (index == -1) return;

    if (name == 'block.minecraft.air') {
        blocks[index] = 0;
        
        detectSwastikas(index);
    } else {
        blocks[index] = 1;
        
        detectSwastikas(index);
    }
}).setFilteredClass(net.minecraft.network.packet.s2c.play.BlockUpdateS2CPacket);

function detectSwastikas(index) {
    let bitboards = generateBitboards(index);

    // ChatLib.chat(bitboards.toString(2));
    // ChatLib.chat(bitboards.toString(2)[12]);

    for (let i = 0; i < bitboards.length; i++) {
        let bitboard = bitboards[i];

        for (let j = 0; j < SWAS_MASKS.length; j++) {
            // search for an exact match. if you do like bitboard & SWAS_MASKS[j], it will trigger for a filled 5x5 square
            if (bitboard == SWAS_MASKS[j]) {
                let { x, y, z } = indexToCoords(index);

                ChatLib.chat(`&6[swasdihtect] &cFound swastika at &a(${x - OFFSET_X}, ${y - OFFSET_Y}, ${z - OFFSET_Z})!`);
            }
        }
    }
}

let DELTA_X = PLOT_SIZE_XZ * PLOT_SIZE_Y;
let DELTA_Y = PLOT_SIZE_XZ;
let DELTA_Z = 1;

function generateBitboards(index) {
    return [...generateXBitboards(index), ...generateYBitboards(index), ...generateZBitboards(index)];
}

function generateXBitboards(index) {
    let tl = index - (4 * DELTA_X) + (4 * DELTA_Y);
    let bitboards = [];

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let bitboard = 0;
            let block = tl;

            for (let k = 0; k < 5; k++) {
                for (let l = 0; l < 5; l++) {
                    if (blocks[block] != 0) bitboard |= (1 << (k * 5 + l));

                    block += DELTA_X;
                }

                block -= (5 * DELTA_X)
                block -= DELTA_Y;
            }

            bitboards.push(bitboard);

            tl += DELTA_X;
        }

        // bring back the tl from traveling in rows
        tl -= 5 * DELTA_X;

        // now update the tl column wise
        tl -= DELTA_Y;
    }

    return bitboards;
}

function generateYBitboards(index) {
    let tl = index - (4 * DELTA_X) + (4 * DELTA_Z);
    let bitboards = [];

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let bitboard = 0;
            let block = tl;

            for (let k = 0; k < 5; k++) {
                for (let l = 0; l < 5; l++) {
                    if (blocks[block] != 0) bitboard |= (1 << (k * 5 + l));

                    block += DELTA_X;
                }

                block -= (5 * DELTA_X)
                block -= DELTA_Z;
            }

            bitboards.push(bitboard);

            tl += DELTA_X;
        }

        // bring back the tl from traveling in rows
        tl -= 5 * DELTA_X;

        // now update the tl column wise
        tl -= DELTA_Z;
    }

    return bitboards;
}

function generateZBitboards(index) {
    let tl = index - (4 * DELTA_Z) + (4 * DELTA_Y);
    let bitboards = [];

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let bitboard = 0;
            let block = tl;

            for (let k = 0; k < 5; k++) {
                for (let l = 0; l < 5; l++) {
                    if (blocks[block] != 0) bitboard |= (1 << (k * 5 + l));

                    block += DELTA_Z;
                }

                block -= (5 * DELTA_Z)
                block -= DELTA_Y;
            }

            bitboards.push(bitboard);

            tl += DELTA_Z;
        }

        // bring back the tl from traveling in rows
        tl -= 5 * DELTA_Z;

        // now update the tl column wise
        tl -= DELTA_Y;
    }

    return bitboards;
}