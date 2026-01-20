const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const levels = require('../data/_list.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit your completion for review.')
        .addStringOption(option =>
            option.setName('level_name')
                .setDescription('The ID of the level you completed')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Your in-game username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('completion')
                .setDescription('The completion video URL or details')
                .setRequired(true))
        .addStringOption((option) =>
            option
                .setName('mod_category')
                .setDescription('Which Mod Menu did you use?')
                .setRequired(true)
                .addChoices(
                    { name: 'Mega Hack v9', value: 'mhv9' },
                    { name: 'Mega Hack v8', value: 'mhv8' },
                    { name: 'Mega Hack v7', value: 'mhv7' },
                    { name: 'Eclipse', value: 'eclipse' },
                    { name: 'QOL Mods', value: 'qol' },
                    { name: 'Vanilla', value: 'vanilla' },
                    { name: 'Other', value: 'other' },
                ))
        .addStringOption((option) =>
            option
                .setName('platform')
                .setDescription('Which Platform did you beat the level on?')
                .setRequired(true)
                .addChoices(
                    { name: 'PC', value: 'pc' },
                    { name: 'Mobile', value: 'mobile' },
                ))
        .addStringOption(option =>
            option
                .setName('raw')
                .setDescription('The raw footage URL or details')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Any additional notes for the reviewers')
                .setRequired(false)),



    async execute(interaction) {

        const completion = interaction.options.getString('completion');
        const raw = interaction.options.getString('raw') || 'N/A';
        const modCategory = interaction.options.getString('mod_category');
        const platform = interaction.options.getString('platform');
        const notes = interaction.options.getString('notes') || 'N/A';
        const levelName = interaction.options.getString('level_name');
        const username = interaction.options.getString('username');

        const submissionEmbed = new EmbedBuilder()
            .setTitle('New Level Completion Submission')
            .addFields(
                { name: 'User', value : `${username} (${interaction.user.tag})` },
                { name: 'Level Name/ID', value: levelName },
                { name: 'Mod Menu Used', value: modCategory },
                { name: 'Platform', value: platform },
                { name: 'Completion', value: completion },
                { name: 'Raw Footage', value: raw },
                { name: 'Notes', value: notes },
            )
            .setTimestamp()
            .setColor("#ec6e0d");

        const EmbedSent = new EmbedBuilder()
            .setTitle('Submission Received')
            .setDescription('Thank you for your submission! Our review team will evaluate your completion and get back to you soon.')
            .setColor("#00FF00")
            .setTimestamp();

        
        const acceptButton = new ButtonBuilder()
            .setCustomId(`accept_${interaction.user.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
            .setCustomId(`deny_${interaction.user.id}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(acceptButton, denyButton);

        const reviewChannel = await interaction.client.channels.fetch('1446185201020440586'); // Replace with your review channel ID
        await reviewChannel.send({ embeds: [submissionEmbed], components: [row] });

        // Store submission data
        const submissionData = {
            levelName,
            username,
            completion,
            raw,
            modCategory,
            platform,
            notes
        };
        interaction.client.submissions.set(interaction.user.id, submissionData);

        // Persist submissions to file
        const fs = require('fs');
        const submissionsObj = Object.fromEntries(interaction.client.submissions);
        fs.writeFileSync('submissions.json', JSON.stringify(submissionsObj, null, 4));

        await interaction.reply({ embeds: [EmbedSent] });


    },

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'level_name') {
            const filtered = levels.filter(level =>
                level.toLowerCase().includes(focusedOption.value.toLowerCase())
            ).slice(0, 25);

            await interaction.respond(
                filtered.map(level => ({ name: level, value: level }))
            );
        }
    },
};
