import fs from 'fs';
import gifInfo from 'gif-info';
import { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton, Interaction } from 'discord.js';

export default class Questionnaire {
    #member;
    #questionnaireData;
    #questionId;
    #primaryId;
    #prompt;
    #channel;
    #deleteMe;
    constructor(member, deleteMe) {
        this.#questionId = 0;
        this.#member = member;
        this.#deleteMe = deleteMe;
        this.#questionnaireData = JSON.parse(fs.readFileSync("./assets/questionnaire.json"));
        this.#sequence();
    }

    #sequence = () => {

        this.#createIntroductionRole()
            .then(category => this.#createUserChannel(category))
            .then(channel => this.#checkQuestionnaireData(channel));
    }

    #createIntroductionRole = async () => {
        let category = (await this.#member.guild.channels.fetch()).find(c => c.name == "Introduction" && c.type == "GUILD_CATEGORY");
        if (!category) category = await this.#member.guild.channels.create("Introduction", { type: "GUILD_CATEGORY" });
        return category;
    }

    #createUserChannel = async (category) => {
        let channelName = (this.#member.user.username + this.#member.user.discriminator).toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, '');
        const everyoneRole = (await category.guild.roles.fetch()).find(c=>c.name=='@everyone');

        let channel = await category.children.find(c =>{
            console.log(`${c.name} ${channelName} ${c.name==channelName}`);
            return c.name == channelName;
        });
        console.log(channel);

        if (!channel) {
            channel = await category.createChannel(channelName);
        }

        await channel.permissionOverwrites.edit(everyoneRole, { VIEW_CHANNEL: false });

        await channel.permissionOverwrites.edit(this.#member.user.id, {
            "VIEW_CHANNEL": true,
            "SEND_MESSAGES": true,
            "ADD_REACTIONS": true,
            "EMBED_LINKS": true,
            "READ_MESSAGE_HISTORY": true
        });


        this.#channel=channel;
        return channel;
    }

    #checkQuestionnaireData = async (channel) =>{
        if(this.#questionId < this.#questionnaireData.length){
            this.#generateQuestionnaire(channel);
        }else{
            await this.#end(channel, this.#member);
        }
    }

    #generateQuestionnaire = async (channel) => {
        let question = this.#questionnaireData[this.#questionId];
        let timeout = 0;
        let embed=new MessageEmbed();
        let components = [];
        let attachments = [];
        let primaryId;
        let currentMessage;

        if ("buttons" in question){
            for(let buttonGroup=0; buttonGroup<question.buttons.length;buttonGroup++){
            components.push(new MessageActionRow());
            for (let button of question.buttons[buttonGroup]){
                components[buttonGroup].addComponents(new MessageButton().setStyle('PRIMARY').setLabel(button.text).setCustomId(button.id));
                if (button.primaryId) primaryId = button.id;
            }
        }
        }

        if("image" in question){
            timeout = gifInfo(fs.readFileSync(`./assets/${question.image}`).buffer).duration;
            attachments.push(new MessageAttachment(`./assets/${question.image}`));
            embed.setImage(`attachment://${question.image}`);
            currentMessage = await channel.send({ embeds: [embed], files: attachments });
        }

        if("text" in question){
            embed.setDescription(question.text);
        }

        if("image" in question){
            setTimeout(async ()=>{
                await currentMessage.removeAttachments();
                embed.setImage(null);
                if(question.text){
                    await currentMessage.edit({ embeds: [embed], components: components });
                }else{
                    currentMessage.delete();
                }

                if (primaryId) {
                    this.#primaryId = primaryId;
                }else if(question.prompt){
                    this.#prompt=question.prompt;
                }else{
                    if(this.#questionId >= this.#questionnaireData.length){
                    await this.#end(channel, this.#member);
                    }else{
                        await this.#sequence();
                    }
                }
            }, timeout)
        }else{
            if("text" in question){
            await channel.send({ embeds: [embed], components: components });
            }else if(components.length>0){
                await channel.send({components: components});
            }


                if (primaryId) {
                    this.#primaryId = primaryId;
                }else if(question.prompt){
                    this.#prompt=question.prompt;
                }else{
                    if(this.#questionId >= this.#questionnaireData.length){
                    await this.#end(channel, this.#member);
                    }else{
                        await this.#sequence();
                    }
                }
        }

        this.#questionId++;
    }

    #end = async (channel, member) => {
        console.log("end");
        let role = (await channel.guild.roles.fetch()).find(role => role.name === "GUEST INTRODUCTION");
    if(!member.permissions.has("ADMINISTRATOR")){
        console.log("role");
    member.roles.add(role);
    }
        await channel.delete();
        this.#deleteMe(this);
    }

    #disableButton = (interaction)=>{
        let components = interaction.message.components;
        for(let i=0; i<components.length; i++){
            for(let j=0; j<components[i].components.length; j++){
                if(components[i].components[j].customId==interaction.customId){
                    components[i].components[j].setDisabled();
                    break;
                }
            }
        }

        console.log("disabled");
        return interaction.update({ content: "🚀🚀🚀", components: components });
    }

    get channel(){
        return this.#channel;
    }

    get member(){
        return this.#member;
    }

    buttonEvent = async (interaction) => {
        try{
        if(interaction.channel.name == (this.#member.user.username + this.#member.user.discriminator).toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, '')){
        await this.#disableButton(interaction);
        console.log(interaction.customId);
        console.log(this.#primaryId);
        if (this.#primaryId === interaction.customId) {
            this.#primaryId=null;
            if(this.#questionId >= this.#questionnaireData.length){
                this.#end(interaction.channel, interaction.member);
            }else{
                this.#sequence();
            }
        }
    }
}catch(e){
    console.log(e);
}
    }

    messageEvent = async(message)=>{
        try{
       
        if(this.#prompt && message.member.id==this.#member.id && this.#channel.id==message.channel){
            if(this.#prompt.minLines && message.content.length<this.#prompt.minLines*30){
                message.reply("Not enough lines.");
                return;
                }
            if(this.#prompt.action){
                if(this.#prompt.action.type=="copy" && this.#prompt.action.channel){
                    let channel = (await message.guild.channels.fetch()).find(c => c.name == this.#prompt.action.channel);
                    channel.send(`${message.member.user} presentation : ${message.content}`);
                }else if(this.#prompt.action.type=="nickname"){
                    if(!message.member.permissions.has("ADMINISTRATOR")){
                    await message.member.setNickname(message.content);
                    }
                }else{
                    this.#channel.send("Une erreur s'est produite... Commande introuvable.");
                }
            }

                this.#prompt=null;

                this.#sequence();
            }
        }catch(e){
            console.log(e);
        }
        }
    }