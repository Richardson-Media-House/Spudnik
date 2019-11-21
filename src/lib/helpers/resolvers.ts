import { Command } from "klasa";
import * as fs from 'fs';

export const hexColor = (color) => {
    if (!color) return;
    if (!isNaN(color.match(/^ *[a-f0-9]{6} *$/i) ? parseInt(color, 16) : NaN)) {
        return color;
    }

    throw 'Please provide a valid color hex number.';
}

export const commandOrCategory = (cmdOrCategory) => {
    if (!cmdOrCategory) throw 'Please provide a valid command or command category name';
    const command = this.client.commands.array().find((command: Command) => command.name.toLowerCase() === cmdOrCategory.toLowerCase());
    if (command) return cmdOrCategory; // valid command name

    const categories: any[] = fs.readdirSync('commands')
        .filter(path => fs.statSync(`commands/${path}`).isDirectory());
    const category = categories.find(category => category === cmdOrCategory.toLowerCase());
    if (category) return cmdOrCategory; // valid category name

    throw 'Please provide a valid command or command category name';
}

export const battletag = (tag) => {
    if (tag.match(/(\w{3,12})#(\d{4,5})/i)) return tag;

    throw 'Please provide a valid battletag in the format: `username#0000`';
}
