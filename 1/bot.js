const {
  Client, GatewayIntentBits,
  ButtonBuilder, ButtonStyle, ActionRowBuilder,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  EmbedBuilder, REST, Routes, SlashCommandBuilder,
  PermissionFlagsBits, AttachmentBuilder
} = require('discord.js');

const db = require('./Db');
const { generateLevelUpCard, generateRankCard } = require('./Canvas');
const { getXpForLevel, getLevelFromXp } = require('./Xp');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// =================== الإعدادات ===================
const TOKEN = 'MTUxNjI3MTM3Mjg0ODg1NzE2OA.G4BVwN.eGPkfLT3phv8xQYis1BycmSzizLh53835wfpXw';
const VOICE_CHANNEL_ID = '1516181488020750406';
const IMAGE_URL = 'https://media.discordapp.net/attachments/1514645648010379376/1516078712553209957/worldcup_panel.png?ex=6a31fe94&is=6a30ad14&hm=2b1e5abff1618823004c5a7f4a56165260a7a5abc17ee111c5544472c45a573f&=&format=webp&quality=lossless';

// =================== XP Cooldown Map ===================
const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 60_000; // 60 ثانية

// =================== قائمة المنتخبات ===================
const teams = [
  { label: 'السعودية',       emoji: '🇸🇦', role: 'السعودية 🇸🇦' },
  { label: 'المغرب',         emoji: '🇲🇦', role: 'المغرب 🇲🇦' },
  { label: 'تونس',           emoji: '🇹🇳', role: 'تونس 🇹🇳' },
  { label: 'الجزائر',        emoji: '🇩🇿', role: 'الجزائر 🇩🇿' },
  { label: 'مصر',            emoji: '🇪🇬', role: 'مصر 🇪🇬' },
  { label: 'الأردن',         emoji: '🇯🇴', role: 'الأردن 🇯🇴' },
  { label: 'قطر',            emoji: '🇶🇦', role: 'قطر 🇶🇦' },
  { label: 'العراق',         emoji: '🇮🇶', role: 'العراق 🇮🇶' },
  { label: 'إيران',          emoji: '🇮🇷', role: 'إيران 🇮🇷' },
  { label: 'أوزبكستان',      emoji: '🇺🇿', role: 'أوزبكستان 🇺🇿' },
  { label: 'الأرجنتين',      emoji: '🇦🇷', role: 'الأرجنتين 🇦🇷' },
  { label: 'البرازيل',       emoji: '🇧🇷', role: 'البرازيل 🇧🇷' },
  { label: 'أوروغواي',       emoji: '🇺🇾', role: 'أوروغواي 🇺🇾' },
  { label: 'كولومبيا',       emoji: '🇨🇴', role: 'كولومبيا 🇨🇴' },
  { label: 'الإكوادور',      emoji: '🇪🇨', role: 'الإكوادور 🇪🇨' },
  { label: 'باراغواي',       emoji: '🇵🇾', role: 'باراغواي 🇵🇾' },
  { label: 'فرنسا',          emoji: '🇫🇷', role: 'فرنسا 🇫🇷' },
  { label: 'إسبانيا',        emoji: '🇪🇸', role: 'إسبانيا 🇪🇸' },
  { label: 'البرتغال',       emoji: '🇵🇹', role: 'البرتغال 🇵🇹' },
  { label: 'إنجلترا',        emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', role: 'إنجلترا 🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { label: 'ألمانيا',        emoji: '🇩🇪', role: 'ألمانيا 🇩🇪' },
  { label: 'هولندا',         emoji: '🇳🇱', role: 'هولندا 🇳🇱' },
  { label: 'بلجيكا',         emoji: '🇧🇪', role: 'بلجيكا 🇧🇪' },
  { label: 'كرواتيا',        emoji: '🇭🇷', role: 'كرواتيا 🇭🇷' },
  { label: 'سويسرا',         emoji: '🇨🇭', role: 'سويسرا 🇨🇭' },
  { label: 'النمسا',         emoji: '🇦🇹', role: 'النمسا 🇦🇹' },
  { label: 'اسكتلندا',       emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', role: 'اسكتلندا 🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { label: 'النرويج',        emoji: '🇳🇴', role: 'النرويج 🇳🇴' },
  { label: 'البوسنة',        emoji: '🇧🇦', role: 'البوسنة 🇧🇦' },
  { label: 'السويد',         emoji: '🇸🇪', role: 'السويد 🇸🇪' },
  { label: 'تركيا',          emoji: '🇹🇷', role: 'تركيا 🇹🇷' },
  { label: 'التشيك',         emoji: '🇨🇿', role: 'التشيك 🇨🇿' },
  { label: 'اليابان',        emoji: '🇯🇵', role: 'اليابان 🇯🇵' },
  { label: 'كوريا الجنوبية', emoji: '🇰🇷', role: 'كوريا الجنوبية 🇰🇷' },
  { label: 'أستراليا',       emoji: '🇦🇺', role: 'أستراليا 🇦🇺' },
  { label: 'السنغال',        emoji: '🇸🇳', role: 'السنغال 🇸🇳' },
  { label: 'جنوب أفريقيا',   emoji: '🇿🇦', role: 'جنوب أفريقيا 🇿🇦' },
  { label: 'كوت ديفوار',     emoji: '🇨🇮', role: 'كوت ديفوار 🇨🇮' },
  { label: 'غانا',           emoji: '🇬🇭', role: 'غانا 🇬🇭' },
  { label: 'الرأس الأخضر',   emoji: '🇨🇻', role: 'الرأس الأخضر 🇨🇻' },
  { label: 'الكونغو',        emoji: '🇨🇩', role: 'الكونغو 🇨🇩' },
  { label: 'أمريكا',         emoji: '🇺🇸', role: 'أمريكا 🇺🇸' },
  { label: 'المكسيك',        emoji: '🇲🇽', role: 'المكسيك 🇲🇽' },
  { label: 'كندا',           emoji: '🇨🇦', role: 'كندا 🇨🇦' },
  { label: 'بنما',           emoji: '🇵🇦', role: 'بنما 🇵🇦' },
  { label: 'هايتي',          emoji: '🇭🇹', role: 'هايتي 🇭🇹' },
  { label: 'كوراساو',        emoji: '🇨🇼', role: 'كوراساو 🇨🇼' },
  { label: 'نيوزيلندا',      emoji: '🇳🇿', role: 'نيوزيلندا 🇳🇿' },
];

// =================== مساعدات ===================
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

// =================== معالجة الأخطاء العامة ===================
client.on('error', (error) => {
  console.error('❌ خطأ في الكلاينت:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ خطأ غير معالج:', error?.message ?? error);
});

// =================== جاهز ===================
client.once('ready', async () => {
  console.log(`✅ البوت شغال: ${client.user.tag}`);

  // تسجيل Slash Commands
  const commands = [
    new SlashCommandBuilder()
      .setName('iynexx')
      .setDescription('نظام الـ Levels والـ XP')
      .addSubcommand(sub =>
        sub.setName('level')
          .setDescription('اعرض Rank Card الخاصة بك أو بشخص آخر')
          .addUserOption(opt =>
            opt.setName('user').setDescription('اختر عضو').setRequired(false)
          )
      )
      .addSubcommand(sub =>
        sub.setName('leaderboard')
          .setDescription('اعرض أعلى 10 أعضاء في السيرفر')
      )
      .addSubcommand(sub =>
        sub.setName('setxp')
          .setDescription('عدّل XP عضو (الأدمن فقط)')
          .addUserOption(opt =>
            opt.setName('user').setDescription('العضو').setRequired(true)
          )
          .addIntegerOption(opt =>
            opt.setName('amount').setDescription('مقدار الـ XP').setRequired(true)
          )
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      )
      .addSubcommand(sub =>
        sub.setName('setlevel')
          .setDescription('عدّل Level عضو (الأدمن فقط)')
          .addUserOption(opt =>
            opt.setName('user').setDescription('العضو').setRequired(true)
          )
          .addIntegerOption(opt =>
            opt.setName('level').setDescription('رقم الـ Level').setRequired(true)
          )
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      )
      .addSubcommand(sub =>
        sub.setName('reset')
          .setDescription('صفّر بيانات عضو (الأدمن فقط)')
          .addUserOption(opt =>
            opt.setName('user').setDescription('العضو').setRequired(true)
          )
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      )
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ تم تسجيل Slash Commands بنجاح');
  } catch (err) {
    console.error('❌ خطأ في تسجيل الأوامر:', err.message);
  }
});

// =================== الرسائل ===================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // =================== نظام XP ===================
  if (message.guild) {
    const userId  = message.author.id;
    const guildId = message.guild.id;
    const now     = Date.now();
    const cdKey   = `${guildId}-${userId}`;

    // تحقق من الـ Cooldown
    const lastXp = xpCooldowns.get(cdKey) || 0;
    if (now - lastXp >= XP_COOLDOWN_MS) {
      xpCooldowns.set(cdKey, now);

      const xpGain   = Math.floor(Math.random() * 11) + 10; // 10 ~ 20
      const userData = db.getUser(userId, guildId);
      const oldLevel = userData.level;

      const newXp    = userData.xp + xpGain;
      const newLevel = getLevelFromXp(newXp);

      db.setUser(userId, guildId, { xp: newXp, level: newLevel });

      // Level Up!
      if (newLevel > oldLevel) {
        try {
          const member     = message.member;
          const avatarUrl  = message.author.displayAvatarURL({ extension: 'png', size: 256 });
          const serverIcon = message.guild.iconURL({ extension: 'png', size: 128 }) || null;

          const cardBuffer = await generateLevelUpCard({
            username:   message.author.username,
            avatarUrl,
            serverIcon,
            level:      newLevel,
          });

          const attachment = new AttachmentBuilder(cardBuffer, { name: 'levelup.png' });
          await message.channel.send({
            content: `🎉 مبروك ${message.author} وصلت إلى Level **${newLevel}**`,
            files:   [attachment],
          });
        } catch (err) {
          console.error('❌ خطأ في إنشاء Level Up Card:', err.message);
          await message.channel.send(
            `🎉 مبروك ${message.author} وصلت إلى Level **${newLevel}**`
          );
        }
      }
    }
  }

  // --- زر المباراة ---
  if (message.content === '/BN') {
    const button = new ButtonBuilder()
      .setCustomId('join_voice')
      .setLabel('⚽ • بث المباراة هنا • ⚽')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);
    await message.channel.send({ content: '||@everyone||', components: [row] });
    await message.delete().catch(() => {});
  }

  // --- اختيار المنتخب (زر واحد يفتح القائمة) ---
  if (message.content === '/your.country') {
    const embed = new EmbedBuilder()
      .setColor(0x1a56db)
      .setImage(IMAGE_URL)
      .setTitle('🏆 كأس العالم 2026')
      .setDescription(
        '**اضغط على الزر أدناه واختر منتخبك**\n\n' +
        '*اختر نفس المنتخب مرة ثانية لإزالة الرتبة*'
      );

    const openButton = new ButtonBuilder()
      .setCustomId('open_country_select')
      .setLabel('🌍 اختر دولتك')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(openButton);
    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }

  // --- تحذير ---
  if (message.content.startsWith('/Tn:')) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply({ content: '❌ هذا الأمر للأدمن فقط!' });
    }

    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      return message.reply({ content: '⚠️ لازم تذكر شخص! مثال: `/Tn: @iyed`' });
    }

    await message.delete().catch(() => {});
    await message.channel.send({
      content:
        `||@everyone|| | <@${mentioned.id}>\n\n` +
        `⚠️ **تحذير رسمي** ⚠️\n\n` +
        `> 🚨 <@${mentioned.id}> **أنت تخالف قوانين السيرفر**\n` +
        `> ⚡ هذا تحذير رسمي، الاستمرار يعرضك للطرد!`
    });
  }

  // --- help ---
  if (message.content === '/help') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply({ content: '❌ هذا الأمر للأدمن فقط!' });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 أوامر البوت')
      .setDescription('━━━━━━━━━━━━━━━━━━━━━━')
      .addFields(
        { name: '⚽ `/BN`',                      value: 'يرسل زر بث المباراة مع @everyone' },
        { name: '🏆 `/your.country`',            value: 'يرسل زر اختيار المنتخب لكأس العالم 2026' },
        { name: '⚠️ `/Tn: @شخص`',               value: 'يرسل تحذير رسمي لشخص معين' },
        { name: '🔧 `/help`',                    value: 'يعرض هذه القائمة (للأدمن فقط)' },
        { name: '📊 `/iynexx level`',            value: 'يعرض Rank Card الخاصة بك' },
        { name: '🏅 `/iynexx leaderboard`',      value: 'يعرض أعلى 10 أعضاء' },
        { name: '✏️ `/iynexx setxp`',            value: 'تعديل XP عضو (الأدمن)' },
        { name: '🔢 `/iynexx setlevel`',         value: 'تعديل Level عضو (الأدمن)' },
        { name: '🔄 `/iynexx reset`',            value: 'تصفير بيانات عضو (الأدمن)' },
      );

    await message.channel.send({ embeds: [embed] });
    await message.delete().catch(() => {});
  }
});

// =================== التفاعلات ===================
client.on('interactionCreate', async (interaction) => {

  // =================== Slash Commands ===================
  if (interaction.isChatInputCommand() && interaction.commandName === 'iynexx') {
    const sub = interaction.options.getSubcommand();

    // ---------- /iynexx level ----------
    if (sub === 'level') {
      await interaction.deferReply();

      const target   = interaction.options.getUser('user') || interaction.user;
      const guildId  = interaction.guildId;
      const userData = db.getUser(target.id, guildId);

      // حساب الرتبة (الترتيب)
      const allUsers = db.getAllUsers(guildId);
      const sorted   = allUsers.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
      const rank     = sorted.findIndex(u => u.userId === target.id) + 1;

      const nextLevelXp = getXpForLevel(userData.level + 1);
      const avatarUrl   = target.displayAvatarURL({ extension: 'png', size: 256 });

      try {
        const cardBuffer = await generateRankCard({
          username:    target.username,
          avatarUrl,
          level:       userData.level,
          xp:          userData.xp,
          nextLevelXp,
          rank,
          totalUsers:  allUsers.length,
        });

        const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });
        await interaction.editReply({ files: [attachment] });
      } catch (err) {
        console.error('❌ خطأ في إنشاء Rank Card:', err.message);
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`📊 Rank Card — ${target.username}`)
          .setThumbnail(avatarUrl)
          .addFields(
            { name: '🏅 Level',    value: `${userData.level}`,               inline: true },
            { name: '⭐ XP',       value: `${userData.xp} / ${nextLevelXp}`, inline: true },
            { name: '🏆 Rank',     value: `#${rank} من ${allUsers.length}`,  inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
      }
    }

    // ---------- /iynexx leaderboard ----------
    if (sub === 'leaderboard') {
      await interaction.deferReply();

      const guildId  = interaction.guildId;
      const allUsers = db.getAllUsers(guildId);
      const top10    = allUsers
        .sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp)
        .slice(0, 10);

      const medals = ['🥇', '🥈', '🥉'];
      const lines  = top10.map((u, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${u.userId}> — Level **${u.level}** • ${u.xp} XP`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`🏆 Leaderboard — ${interaction.guild.name}`)
        .setDescription(lines.length ? lines.join('\n') : 'لا يوجد بيانات بعد!')
        .setThumbnail(interaction.guild.iconURL({ extension: 'png' }) || null)
        .setFooter({ text: `إجمالي الأعضاء المسجلين: ${allUsers.length}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    // ---------- /iynexx setxp ----------
    if (sub === 'setxp') {
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      if (amount < 0) {
        return interaction.reply({ content: '❌ الـ XP يجب أن يكون أكبر من أو يساوي صفر!', ephemeral: true });
      }

      const newLevel = getLevelFromXp(amount);
      db.setUser(target.id, interaction.guildId, { xp: amount, level: newLevel });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setDescription(`✅ تم تعديل XP الخاص بـ <@${target.id}> إلى **${amount} XP** (Level ${newLevel})`)
        ]
      });
    }

    // ---------- /iynexx setlevel ----------
    if (sub === 'setlevel') {
      const target   = interaction.options.getUser('user');
      const level    = interaction.options.getInteger('level');

      if (level < 0) {
        return interaction.reply({ content: '❌ الـ Level يجب أن يكون أكبر من أو يساوي صفر!', ephemeral: true });
      }

      const baseXp = getXpForLevel(level);
      db.setUser(target.id, interaction.guildId, { xp: baseXp, level });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setDescription(`✅ تم تعديل Level الخاص بـ <@${target.id}> إلى **Level ${level}**`)
        ]
      });
    }

    // ---------- /iynexx reset ----------
    if (sub === 'reset') {
      const target = interaction.options.getUser('user');
      db.setUser(target.id, interaction.guildId, { xp: 0, level: 0 });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xe74c3c)
            .setDescription(`🔄 تم تصفير بيانات <@${target.id}> بنجاح`)
        ]
      });
    }
  }

  // --- زر المباراة ---
  if (interaction.isButton() && interaction.customId === 'join_voice') {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({
        content: '⚠️ لازم تكون داخل أي Voice Channel أول!',
        ephemeral: true
      });
    }
    try {
      const targetChannel = interaction.guild.channels.cache.get(VOICE_CHANNEL_ID);
      await member.voice.setChannel(targetChannel);
      await interaction.reply({
        content: `✅ تم نقلك لـ **${targetChannel.name}**!`,
        ephemeral: true
      });
    } catch (err) {
      await interaction.reply({
        content: '❌ ما قدرت أنقلك، تأكد من صلاحيات البوت.',
        ephemeral: true
      });
    }
  }

  // --- زر "اختر دولتك" → يعرض القوائم ---
  if (interaction.isButton() && interaction.customId === 'open_country_select') {
    const teamChunks = chunk(teams, 25);

    const rows = teamChunks.map((ch, i) => {
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`select_team_${i}`)
        .setPlaceholder('🌍 اختر دولتك من هنا')
        .addOptions(
          ch.map(t =>
            new StringSelectMenuOptionBuilder()
              .setLabel(t.label)
              .setValue(t.label)
              .setEmoji(t.emoji)
          )
        );
      return new ActionRowBuilder().addComponents(menu);
    });

    await interaction.reply({
      content: '👇 اختر منتخبك:',
      components: rows,
      ephemeral: true
    });
  }

  // --- اختيار المنتخب من القائمة ---
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('select_team')) {
    await interaction.deferReply({ ephemeral: true });

    const selected = interaction.values[0];
    const team     = teams.find(t => t.label === selected);
    const member   = interaction.member;
    const guild    = interaction.guild;

    try {
      await member.fetch();

      let role = guild.roles.cache.find(r => r.name === team.role);
      if (!role) {
        role = await guild.roles.create({
          name:   team.role,
          reason: 'رتبة منتخب كأس العالم 2026'
        });
      }

      // إذا عنده الرتبة، نشيلها
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return interaction.editReply({
          content: `❌ تمت إزالة رتبة **${team.role}**`
        });
      }

      // نشيل أي رتبة منتخب قديمة
      for (const t of teams) {
        const oldRole = guild.roles.cache.find(r => r.name === t.role);
        if (oldRole && member.roles.cache.has(oldRole.id)) {
          await member.roles.remove(oldRole).catch(() => {});
        }
      }

      // نضيف الرتبة الجديدة
      await member.roles.add(role);
      await interaction.editReply({
        content: `${team.emoji} تم تعيين رتبة **${team.role}** لك!`
      });

    } catch (err) {
      console.error('❌ خطأ في اختيار المنتخب:', err.message);
      await interaction.editReply({
        content: '❌ صار خطأ، حاول مرة ثانية بعد شوي.'
      });
    }
  }
});

client.login(TOKEN);