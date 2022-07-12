import {Command, Env} from "./index";
import {InteractionResponseFlags, InteractionResponseType} from "discord-interactions";

export type CommandHandler = (command: Command, env: Env) => Response

export interface CommandStruct {
    name: string
    description: string
    handler: CommandHandler
}

export class CommandRouter {
    commands: Map<string, CommandHandler>
    constructor() {
        this.commands = new Map<string, CommandHandler>()
    }
    //register commands to route/listen for
    register(c: CommandStruct) {
        this.commands.set(c.name, c.handler)
    }
    //find a command handler to run for a command name
    handle(command: Command, env: Env): Response {
        for(const [n, f]  of this.commands.entries()) {
            if(command.name === n) {
                return f(command, env)
            }
        }
        return new Response(`no handler for ${command.name}`, {status: 400})
    }
}

export const PING_COMMAND = {
    name: 'ping',
    description: 'Test the bot connection.',
    handler(command: Command, env: Env): Response {
        const resp = {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: "PONG",
                tts: false,
                embeds: [],
            }
        }
        return new Response(JSON.stringify(resp), {status: 200, headers: {'Content-Type': 'application/json'}})
    }
}

export const INVITE_COMMAND = {
    name: 'invite',
    description: 'Get an invitation link for this bot.',
    handler(command: Command, env: Env): Response {
        const INVITE_LINK = `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APPLICATION_ID}&scope=applications.commands%20bot`
        const resp = {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: INVITE_LINK,
                flags: InteractionResponseFlags.EPHEMERAL
            }
        }
        return new Response(JSON.stringify(resp), {status: 200, headers: {'Content-Type': 'application/json'}})
    }
}

export const FLIP_COMMAND = {
    name: 'flip',
    description: 'Flip a coin.',
    handler(command: Command, env: Env): Response {
        const heads = Math.random() >= 0.5
        const resp = {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `:thumbsup: :coin: ${heads ? 'Heads' : 'Tails'}!`
            }
        }
        return new Response(JSON.stringify(resp), {status: 200, headers: {'Content-Type': 'application/json'}})
    }
}

export const ROLL_COMMAND = {
    name: 'roll',
    description: 'Roll some dice.',
    //parse XdN where X is a positive integer and N is also a positive integer
    //for X times, generate a random number from 1-N inclusive

    handler(command: Command, env: Env): Response {
        let x, n: number
        if (command.options === undefined) {
            return new Response('Invalid command options.', {status: 400})
        } else {
            [x, n] = parseDice(command.options[0].value)
            console.log({x, n})
        }
        if (!x || !n || x < 1 || n < 1) {
            return new Response('Unable to parse command options.', {status: 400})
        }
        const rolls = roll(x, n)
        console.log({rolls})
        let message = ':game_die: Rolling your dice... :game_die:\n'
        for (const roll of rolls) {
            message += `:white_small_square: ${roll}\n`
        }
        const resp = {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: message
            }
        }
        return new Response(JSON.stringify(resp), {status: 200, headers: {'Content-Type': 'application/json'}})
    }
}

function roll (x: number, n: number): number[] {
    const rolls = [];
    for (let i = 0; i < x; i++) {
        rolls.push(Math.floor((Math.random() * n) + 1))
    }
    return rolls
}

function parseDice(dice: string): number[] {
    const parts = dice.split('d')
    if (parts.length !== 2) {
        return []
    }
    const x = parseInt(parts[0], 10)
    const n = parseInt(parts[1], 10)
    return [x, n]
}
