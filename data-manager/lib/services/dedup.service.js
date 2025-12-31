import stringSimilarity from 'string-similarity';
import fs from 'fs';
import colors from 'colors';

/**
 * Checks if an incoming developer name matches an existing one using fuzzy logic.
 * If a match is found, it returns the existing developer's ID and name.
 * @param {string} incomingName - The name from the CSV.
 * @param {Array<{id: string, nombre: string}>} existingDevelopers - List of pre-loaded developers.
 * @returns {{match: boolean, id?: string, name?: string, score?: number}}
 */
export const checkDeveloperDuplicate = (incomingName, existingDevelopers) => {
    if (!incomingName || !existingDevelopers || existingDevelopers.length === 0) {
        return { match: false };
    }

    const matches = stringSimilarity.findBestMatch(incomingName, existingDevelopers.map(d => d.nombre));
    const best = matches.bestMatch;

    if (best.rating > 0.90) {
        const matchedDev = existingDevelopers[matches.bestMatchIndex];
        return {
            match: true,
            id: matchedDev.id,
            name: matchedDev.nombre,
            score: best.rating
        };
    }

    return { match: false };
};

export const logDuplicate = (incoming, existing, score) => {
    const dupLog = {
        incoming,
        existing,
        score,
        action: 'MERGED'
    };
    try {
        if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
        }
        fs.appendFileSync('./logs/duplicates.json', JSON.stringify(dupLog) + '\n');
        console.log(colors.yellow(`   ⚠️  Duplicado detectado (Fuzzy): '${incoming}' ~= '${existing}' (${(score * 100).toFixed(0)}%). Fusionando.`));
    } catch (e) {
        console.error('Error writing duplicate log', e);
    }
};
