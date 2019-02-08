const Command = require('../../structures/Command');
const { createCanvas, loadImage, registerFont } = require('canvas');
const request = require('node-superfetch');
const path = require('path');
const { wrapText } = require('../../util/Canvas');
registerFont(path.join(__dirname, '..', '..', 'assets', 'fonts', 'Impact.ttf'), { family: 'Impact' });

module.exports = class MemeGenCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'meme-gen',
			aliases: ['meme-generator', 'create-meme'],
			group: 'image-edit',
			memberName: 'meme-gen',
			description: 'Sends a meme with the text and background of your choice.',
			throttling: {
				usages: 1,
				duration: 10
			},
			clientPermissions: ['ATTACH_FILES'],
			args: [
				{
					key: 'top',
					prompt: 'What should the something to believe in be?',
					type: 'string',
					max: 50
				},
				{
					key: 'bottom',
					prompt: 'What should believing result in (e.g. sacrificing everything)?',
					type: 'string',
					max: 50
				},
				{
					key: 'image',
					prompt: 'What image would you like to edit?',
					type: 'image',
					default: msg => msg.author.displayAvatarURL({ format: 'png', size: 2048 })
				}
			]
		});
	}

	async run(msg, { top, bottom, image }) {
		try {
			const { body } = await request.get(image);
			const base = await loadImage(body);
			const canvas = createCanvas(base.width, base.height);
			const ctx = canvas.getContext('2d');
			ctx.drawImage(base, 0, 0);
			const fontSize = Math.round(base.height / 10);
			ctx.font = `${fontSize}px Impact`;
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			const topLines = await wrapText(ctx, top, base.width - 10);
			for (let i = 0; i < topLines.length; i++) {
				const textHeight = (i * fontSize) + (i * 10);
				ctx.fillText(topLines[i], base.width / 2, textHeight);
			}
			const bottomLines = await wrapText(ctx, bottom, base.width - 10);
			for (let i = 0; i < bottomLines.length; i++) {
				const textHeight = base.height - (i * fontSize) - (i * 10);
				ctx.fillText(bottomLines[i], base.width / 2, textHeight);
			}
			const attachment = canvas.toBuffer();
			if (Buffer.byteLength(attachment) > 8e+6) return msg.reply('Resulting image was above 8 MB.');
			return msg.say({ files: [{ attachment, name: 'meme-gen.png' }] });
		} catch (err) {
			return msg.reply(`Oh no, an error occurred: \`${err.message}\`. Try again later!`);
		}
	}
};
