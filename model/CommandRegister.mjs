import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

export default class CommandRegister{
  #rest;
  #commands;
    constructor(commands){
        this.#rest=new REST({ version: '9' }).setToken(process.env.TOKEN);
        this.#commands=commands;
        new Promise((resolve, reject)=>this.#send(resolve, reject));
    }

    #send = async (resolve, reject)=>{
            try {
              await this.#rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: this.#commands },
              );
                resolve();
            } catch (error) {
              console.error(error);
              reject();
            }
    }
}