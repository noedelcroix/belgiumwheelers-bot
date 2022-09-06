import CommandRegister from "../model/CommandRegister.mjs";
import Logger from "../model/Logger.mjs";
import { Client, Intents } from 'discord.js';
import { config } from 'dotenv';
import Questionnaire from "../model/Questionnaire.mjs";
import fs from 'fs';

class main{
  #questionnaires;
  #log;
  #client;
  constructor(){
    this.#questionnaires = [];
    this.#log = new Logger().log;
    config();
    new CommandRegister(JSON.parse(fs.readFileSync("./assets/commands.json")));
    this.#client = new Client({ intents: ["GUILDS", "GUILD_INTEGRATIONS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES", "GUILD_INVITES"] });
    this.#startListeners();
  }

  #startListeners=()=>{
    this.#client.on('ready', ()=>{console.log("client ready")});
    this.#client.on('interactionCreate', (interaction)=>this.#interactionListener(interaction));
    this.#client.on('guildMemberAdd', (member)=>{
      console.log("new user");
      this.#questionnaires.forEach((quest)=>{
        if(member==quest.member){
          this.#deleteMe(quest);
      }
    })
      this.#questionnaires.push(new Questionnaire(member, this.#deleteMe));
    });
    this.#client.on("messageCreate", async (message)=>{this.#messageListener(message);})
    this.#client.login(process.env.TOKEN);
  }

  #messageListener = async (message)=>{
    this.#questionnaires.forEach((questionnaire)=>{
      if(questionnaire.channel && message.channel.id==questionnaire.channel.id) questionnaire.messageEvent(message);
    })
  }

  #interactionListener = async(interaction)=>{
    if(interaction.inGuild()){
    if(interaction.isCommand()){
      switch(interaction.commandName){
        case "clean":
          if(interaction.member.permissions.has("ADMINISTRATOR")){
          this.#cleanChannel(interaction);
          }else{
            interaction.reply("Your are not allowed to do that...");
          }
          break;
        case "questionnaire":
          this.#client.emit("guildMemberAdd", interaction.member);
          interaction.reply("Questionnaire...");
          break;
      }
    }else if(interaction.isButton()){
      console.log("button");
      this.#questionnaires.forEach((questionnaire)=>questionnaire.buttonEvent(interaction));
    }
  }
  return;
  }

  #cleanChannel = async (interaction)=>{
    interaction.reply("Cleaning...");
    while((interaction.options._subcommand == "keep" && (await interaction.channel.messages.fetch()).size>1) || (interaction.options._subcommand != "keep" && (await interaction.channel.messages.fetch()).size>0)){
    let channelMessages = (await interaction.channel.messages.fetch()).sort((a, b) => a.createdTimestamp < b.createdTimestamp);

    for (let [key, message] of channelMessages){
      if (interaction.options._subcommand != "keep" || message.id != channelMessages.last().id){
          await message.delete();
      }
  }
}
  }

  #deleteMe = async(questionnaire)=>{
    this.#questionnaires = this.#questionnaires.filter((quest)=>{
      return questionnaire!=quest;
    });
  }
}

new main();

