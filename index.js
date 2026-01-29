const { Client, GatewayIntentBits } = require('discord.js');

const DISCORD_TOKEN = 'MTQ2NjE5ODkxMDExNTc3NDU5Nw.Gv8Cea.N-Ip842-H-jqLlbVVZ7mlmZBx5QMbb6Zd9jftw';
const PRESTASHOP_URL = 'https://mafranchise.com/api';
const PRESTASHOP_API_KEY = 'TU2Y9Z5DBUJBKU266XF7SS9WVUZYPWMF';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Ignorer les messages du bot lui-même
  if (message.author.bot) return;

  // Commande !stock
  if (message.content.startsWith('!stock')) {
    const args = message.content.split(' ');
    const productId = args[1];

    if (!productId) {
      return message.reply('❌ Utilisation : `!stock [id_produit]`');
    }

    try {
      const auth = Buffer.from(PRESTASHOP_API_KEY + ':').toString('base64');
      const response = await fetch(
        `${PRESTASHOP_URL}/stock_availables?filter[id_product]=${productId}&output_format=JSON`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      const data = await response.json();
      const stocks = data.stock_availables || [];

      if (stocks.length === 0) {
        return message.reply(`❌ Produit #${productId} introuvable`);
      }

      const totalStock = stocks.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
      
      message.reply(`📦 **Stock produit #${productId}**\n✅ Quantité disponible : **${totalStock}** unités`);

    } catch (error) {
      message.reply(`❌ Erreur : ${error.message}`);
    }
  }

  // Commande !commandes
  if (message.content === '!commandes') {
    try {
      const today = new Date().toISOString().split('T')[0];
      const auth = Buffer.from(PRESTASHOP_API_KEY + ':').toString('base64');
      const response = await fetch(
        `${PRESTASHOP_URL}/orders?filter[date_add]=[${today},${today}]&display=full&output_format=JSON`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      const data = await response.json();
      const orders = data.orders || [];

      if (orders.length === 0) {
        return message.reply(`📋 Aucune commande aujourd'hui (${today})`);
      }

      const totalCA = orders.reduce((sum, o) => sum + parseFloat(o.total_paid || 0), 0);
      const ordersList = orders.slice(0, 10).map(o =>
        `• Commande #${o.id} - ${parseFloat(o.total_paid).toFixed(2)}€`
      ).join('\n');

      message.reply(`📋 **Commandes du jour** (${today})\n\n${ordersList}\n\n💰 **Total : ${totalCA.toFixed(2)}€** (${orders.length} commande${orders.length > 1 ? 's' : ''})`);

    } catch (error) {
      message.reply(`❌ Erreur : ${error.message}`);
    }
  }

  // Commande !aide
  if (message.content === '!aide' || message.content === '!help') {
    message.reply(
      '**📦 Commandes disponibles :**\n\n' +
      '`!stock [id_produit]` - Consulter le stock d\'un produit\n' +
      '`!commandes` - Voir les commandes du jour\n' +
      '`!aide` - Afficher cette aide'
    );
  }
});

client.login(DISCORD_TOKEN);
