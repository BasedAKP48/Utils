// Type definitions for Utils
// Project: BasedAKP48
// Definitions by: Austin Peterson <austin@akpwebdesign.com> (https://blog.akpwebdesign.com/)

import { Reference, ThenableReference } from 'firebase-admin/database'
import admin from 'firebase-admin'
import EventEmitter from 'events'

/** CID of plugin */
declare type CID = string

declare interface AKP48Message {
  /** 
   * Defines the sender of the message
   * @incoming unique ID of user
   * @outgoing cid of plugin
   */
  uid: string
  /** 
   * @incoming cid of connector.
   * @outgoing intended target (set by server)
   */
  cid: CID
  /** Message text */
  text: string
  /** Channel ID */
  channel: string
  /** Type of message received */
  type?: string
  /** Time the message was sent */
  timeReceived?: number
  /** Extra data the message contains */
  data?: string | object
  /** 
   * Direction of the message. Set by server.
   * 
   * in: A message received from external sources
   * 
   * out: A message sent by a plugin
   */
  direction?: 'in' | 'out'
}

declare interface OutgoingMessage extends AKP48Message {
  /** CID of your plugin */
  uid: CID
  /** Use `target` instead */
  cid: never
  /** CID of the plugin receiving the message */
  target: CID
  /** Set by server if unset. Default: Date.now() */
  timeReceived?: number
  /** Default: 'text' */
  type?: string
  /** Direction of the message. Set by server. */
  direction?: 'out'
}

/** A message sent from external sorces */
declare interface IncomingMessage extends AKP48Message {
  /** Unique identifier of sender */
  uid: string
  /** Connector identifier */
  cid: string
  timeReceived: number
  direction: 'in'
}

declare interface InternalMessage extends AKP48Message {
  /** CID of the plugin that sent this message. This is your `target`. */
  uid: CID
  /** Your plugins CID */
  cid: CID
  /** This is your `command` */
  text: string
  /** This is your `arg` */
  channel: string
  /** Data received from plugin */
  data: object
  /** This is an internal message */
  type: 'internal'
}

declare namespace Utils {
  type ResponseMessage = {
    /** CID of target plugin */
    target: CID
    /** Command (linked to `text`) */
    command: string
    /** Arguments (linked to `channel`) */
    arg: string
    /** Data to send with message. */
    data?: string | object
  }

  type ResponseOptions = {
    /**
     * Time to wait before rejecting the promise. 
     * 
     * Must be at least 1000 (1 second). Default: 60000 (1 minute) 
     */
    timeout?: number
  }

  interface GetCIDOptions {
    /** Firebase Database root */
    root: Reference
    /** Path to CID file. */
    cidPath?: string
    /** Root directory of the plugin. */
    dir?: string
    /** CID file name. */
    file?: string
  }

  interface ModuleOptions {
    /**
     * Will be ignored if you construct a "Plugin" or "Connector".
     * 
     * Must be supplied if you extend "Module".
     */
    type: 'Plugin' | 'Connector' | 'Custom'
    /** Name of module (optional). */
    name?: string
    /** Firebase Database root reference (optional). Will attempt to generate if missing. */
    root?: Reference
    /** Firebase service account (optional). Will attempt to load serviceAccount.json next to the entry script, then fall back to Application Default Credentials. */
    serviceAccount?: admin.ServiceAccount
    /** CID (optional). Will create from database if missing. */
    cid?: string
    /** CID file path (optional). */
    cidPath?: string
    /** Path to working directory (optional). */
    dir?: string
    /** CID file name (optional). */
    dirFile?: string
    /** An object describing the package.json file (optional). */
    pkg?: object
    /** Listen mode of the plugin module (optional). Defaults to "normal". */
    listenMode?: string
  }

  interface MessagingSystemOptions {
    /** Firebase Database root reference. */
    rootRef: Reference
    /** The client ID to use. */
    cid: string
    /** The mode to listen in. */
    listenMode: string
    /** Whether to delete messages after emitting. */
    deleteAfterEmit: boolean
  }

  interface PresenceSystemOptions {
    /** Firebase Database root reference. */
    rootRef: Reference
    /** The client ID to use. */
    cid: string
    /** An object describing the package.json file. */
    pkg: object
    /** The mode to listen in. */
    listenMode: string
    /** The name of this instance for display to users. */
    instanceName: string
  }

  /** Prefix to apply to forwarded events */
  type ForwarderPrefix = string;
  /** Events to not forward */
  type ForwarderExceptions = string[];
  
  interface ForwarderOptions {
    /** Prefix to apply to forwarded events */
    prefix?: ForwarderPrefix
    /** Events to not forward */
    except?: string | string[]
  }

  /**
   * Ensures that all keys are included in an options object.
   * @param {object} options The options to check for required keys in.
   * @param {string[]} required The keys to check for.
   * @return {boolean} Whether or not the required properties exist.
   */
  function ensureRequired(options: object, required: string[]) : boolean

  /**
   * Forwards events from one emitter to another.
   * @param from Forwarding emitter
   * @param to Receiving emitter
   * @param options options for forwarding events
   */
  function eventForwarder(from: EventEmitter, to: EventEmitter, options?: ForwarderOptions): void
  /**
   * Forwards events from one emitter to another.
   * @param from Forwarding emitter
   * @param to Receiving emitter
   * @param prefix Prefix to apply to events
   */
  function eventForwarder(from: EventEmitter, to: EventEmitter, prefix?: ForwarderPrefix): void
  /**
   * Forwards events from one emitter to another.
   * @param from Forwarding emitter
   * @param to Receiving emitter
   * @param except Events not to forward
   */
  function eventForwarder(from: EventEmitter, to: EventEmitter, except?: ForwarderExceptions): void

  /**
   * Loads or generates a CID for you.
   * If {@param dir} is null a key will be generated without any I/O access.
   */
  function getCID(options: GetCIDOptions)
  
  /**
   * Prepare a new message based off of an existing message.
   *
   * @param {AKP48Message} msg Message to respond to.
   * @param {string} uid Sender of the message your plugin identifier (usually)
   * @param {string} text Text to include in reply
   * @param {object} [data] data to include in reply
   * @returns {object}
   */
  function getReply(msg: AKP48Message, uid: string, text: string, data: object) : OutgoingMessage
  
  /**
   * Initializes a FirebaseAdmin application.
   * Uses Application Default Credentials when no service account is given; the project then comes from GOOGLE_CLOUD_PROJECT.
   * The database URL defaults to https://<project>.firebaseio.com and can be overridden with FIREBASE_DATABASE_URL.
   * @param {admin.ServiceAccount} [serviceAccount] Service account file from the Firebase web application
   * @param {string} [appname] Optional name to initialize with.
   */
  function initialize(serviceAccount?: admin.ServiceAccount, appname?: string)

  /**
   * Returns a clean object (original or new) ready for storing in Firebase.
   * @param {object} object Potentially unsafe object.
   * @returns {object} Original or new clean object.
   */
  function safeObject(object: object): object

  /**
   * Returns a cleaned string ready for use in Firebase.
   * @param {string} string Potentially unsafe string.
   */
  function safeString(string: string): string

  /**
   * Returns true if string is unsafe
   * @param {string} string string to validate
   * @param {boolean} [path] true if string is a path
   */
  function isUnsafe(string: string, path?: boolean): boolean

  interface CommandArg {
    /** Lowercase letters, digits, "-" or "_", up to 32 characters. */
    name: string
    /** 1 to 100 characters. */
    description: string
    /**
     * A user, channel, role or mentionable is read as an id, from a mention or an id when typed.
     * A number may have decimals. An attachment can only be given with the slash command, so
     * typed text cannot fill a required one.
     */
    type: 'string' | 'integer' | 'number' | 'boolean' | 'user' | 'channel' | 'role' | 'mentionable' | 'attachment'
    /** Required args must come before optional ones. Default: false */
    required?: boolean
    /**
     * At most 25 values to pick from, for connectors that can show a picker, or at most 500 with
     * autocomplete. Only string, integer and number args can have them: a string choice has text
     * for a value, an integer choice a whole number, a number choice any number. Typed text
     * must be a value or a name. The plugin should still check the value it gets. Cannot be
     * combined with the limits below.
     */
    choices?: CommandChoice[]
    /**
     * Search the choices as someone types, so a list can be longer than 25. Needs choices. When
     * typed, part of a name is enough if only one choice has it.
     */
    autocomplete?: boolean
    /** For integer and number args. Typed text outside the limits is refused. */
    minValue?: number
    maxValue?: number
    /** For string args, from 0 to 6000 and from 1 to 6000. Typed text outside them is refused. */
    minLength?: number
    maxLength?: number
  }

  interface CommandChoice {
    /** 1 to 100 characters, shown to the person choosing. */
    name: string
    /** Text of 1 to 100 characters for a string arg, a whole number for an integer arg, any number for a number arg. */
    value: string | number
  }

  /**
   * A command a plugin offers. Any other property must be an object holding settings
   * for one kind of connector, such as "discord".
   */
  interface CommandDefinition {
    /** 1 to 100 characters. */
    description: string
    /**
     * Puts the command in a group of related commands, which a connector can show as
     * subcommands of one command: /voucher buy. In text it can be typed as ".voucher buy" or
     * with its whole name. Lowercase letters, digits, "-" or "_", up to 32 characters. A group
     * has at most 25 commands, and its name cannot be the name of a command.
     */
    group?: string
    /**
     * The name of the command inside its group. Default: the name of the command without the
     * name of the group and a dash, so "voucher-buy" in the group "voucher" is "buy".
     */
    subcommand?: string
    /** What the group is for, 1 to 100 characters. The first one found for a group is used. */
    groupDescription?: string
    /**
     * Also offers the command in the right-click menu of a user or a message, for connectors
     * that have one. The command runs as it does when typed, with the arg named by arg filled
     * from what was clicked: a user fills a user arg with the id, a message fills a string arg
     * with its text. Every other arg must be optional, since a menu cannot ask for it. A
     * connector can show at most 5 menu commands of each type.
     */
    context?: {
      type: 'user' | 'message'
      /** The arg the clicked user or message fills. */
      arg: string
      /** 1 to 32 characters, capitals and spaces allowed. Default: the name of the command in words. */
      name?: string
    }
    /** Other names the command answers to in text. */
    aliases?: string[]
    /** At most 25, in the order they are written in text. */
    args?: CommandArg[]
    /** Replies are normally private, for connectors that can hide a reply. */
    private?: boolean
    /** Set to false in the database to switch the command off. */
    enabled?: boolean
    /** Set to true in the database to stop new args from being added to this command. */
    argLock?: boolean
    [connector: string]: unknown
  }

  interface CollectedCommand extends CommandDefinition {
    name: string
    cid: CID
    /** Package name of the plugin that offers the command. */
    plugin: string
    instance: string
    online: boolean
  }

  interface CollectedCommands {
    /** Enabled, valid commands. Online plugins win a name clash. */
    commands: CollectedCommand[]
    conflicts: { name: string, cid: CID, winner: CID }[]
    invalid: { cid: CID, name: string, problems: string[] }[]
  }

  /**
   * Reads the commands of every plugin in the registry from its config.
   * Only config/<cid>/commands is read for each plugin.
   * @param {Reference} root Firebase Database root reference.
   */
  function collectCommands(root: Reference): Promise<CollectedCommands>

  /**
   * Settings every command of a plugin starts from, stored at config/<cid>/commandDefaults.
   * A command's own value for the same setting wins, and lists replace instead of joining.
   * Settings for one kind of connector sit under that connector's name, such as "discord".
   * Use "*" in a list of servers for every server, since the database cannot store an empty list.
   */
  interface CommandDefaults {
    enabled?: boolean
    private?: boolean
    [connector: string]: unknown
  }

  /**
   * The settings of one command with the plugin defaults applied, from the config a module
   * receives in its "config" event. Falls back to the definitions in code if the command
   * has not been stored yet.
   */
  function commandSettings(
    config: object | undefined,
    name: string,
    definitions?: { [name: string]: CommandDefinition },
  ): Partial<CommandDefinition>

  /**
   * Whether a command may run for a message. Applies a disabled command, the servers a command is
   * limited to, and direct messages, using the settings for the message's connector.
   * Direct messages are allowed unless the command sets dmPermission to false.
   */
  function allowedHere(settings: object | undefined, message: object | undefined): boolean

  /** The servers a command is limited to on Discord, or an empty list if it is not limited. */
  function commandGuilds(settings: object | undefined): string[]

  /** The result of reading a command from typed text. */
  interface ParsedCommand {
    /** The command that was named, found by name or alias. */
    command: { name: string, aliases?: string[], args?: CommandArg[] }
    /** The arguments by name, typed. Anything that was left out is missing. */
    args?: { [name: string]: string | number | boolean }
    /** Why the arguments could not be read, when they could not. */
    problem?: string
  }

  /**
   * Reads typed text as a command. Returns null when the text is not one of the commands.
   * Whole numbers and yes/no words are converted. A text argument takes the rest of the line,
   * and when several text arguments follow each other they are separated by a bar.
   * Set direct to accept the command without the prefix, as in a direct message.
   */
  function parseCommand(
    text: string,
    commands: Iterable<{ name: string, aliases?: string[], args?: CommandArg[] }>,
    options?: { prefix?: string, direct?: boolean },
  ): ParsedCommand | null

  /** The usage line of a command, such as ".feature-bid <id> <amount> [hidden]". */
  function commandUsage(
    command: { name: string, args?: CommandArg[] },
    prefix?: string,
  ): string

  /**
   * Checks command definitions keyed by name.
   * @returns {string[]} A description of every problem, empty if the definitions are valid.
   */
  function validateCommands(commands: object): string[]

  /** The name a command has in a right-click menu: the one it gives, or its own name in words. */
  function menuName(command: { name: string, context?: { name?: string } }): string

  /**
   * Sorts collected commands that have a context into the menus of users and of messages, each
   * with the name to show and the arg the click fills. Commands that cannot be shown are
   * reported: a menu name that is taken for that type, whatever the case (the first one wins),
   * and more than 5 menus of a type.
   */
  function contextMenus<T extends { name: string, context?: { type: 'user' | 'message', arg: string, name?: string } }>(
    commands: Iterable<T>,
  ): {
    user: { name: string, command: T, arg: string }[]
    message: { name: string, command: T, arg: string }[]
    conflicts: { name: string, type: 'user' | 'message', reason: string }[]
  }

  /** The name of a command inside its group, or undefined for a command without a group. */
  function subcommandName(command: { name: string, group?: string, subcommand?: string }): string | undefined

  /**
   * Sorts collected commands into those without a group and groups of subcommands, ready for a
   * connector to register. Commands that cannot be shown are reported: a subcommand name that is
   * already taken in its group (the first one wins), a group named like a command, and more than
   * 25 subcommands in a group. A group without a description gets its name.
   */
  function groupCommands<T extends { name: string, group?: string, subcommand?: string, groupDescription?: string }>(
    commands: Iterable<T>,
  ): {
    standalone: T[]
    groups: { name: string, description: string, subcommands: { name: string, command: T }[] }[]
    conflicts: { name: string, group: string, reason: string }[]
  }

  /**
   * The choices that match what someone has typed, at most limit (default 25): names or values
   * that start with it first, then those that contain it, in the order of the list. Case does
   * not matter. Nothing typed gives the first choices.
   */
  function filterChoices(choices: CommandChoice[], query?: string, limit?: number): CommandChoice[]

  interface ActionButton {
    /** 1 to 50 letters, digits, "_", ".", ":" or "-". Used once in a message. */
    id: string
    /** 1 to 80 characters. */
    label: string
    /** Default: "secondary". */
    style?: 'primary' | 'secondary' | 'success' | 'danger'
    disabled?: boolean
  }

  interface LinkButton {
    /** An http or https address of at most 512 characters. */
    url: string
    /** 1 to 80 characters. */
    label: string
    disabled?: boolean
  }

  type Button = ActionButton | LinkButton

  /** At most 5 buttons. */
  type ButtonRow = Button[]

  /**
   * Checks buttons: a list of buttons for one row, or a list of up to 5 rows. An empty list is
   * valid, and takes the buttons off a message.
   * @returns {string[]} A description of every problem, empty if the buttons are valid.
   */
  function validateComponents(components: Button[] | ButtonRow[]): string[]

  /**
   * Checks buttons and returns them as rows, as a copy. A flat list of buttons is one row.
   * Throws, listing every problem, if they are not valid.
   */
  function buildComponents(components: Button[] | ButtonRow[]): ButtonRow[]

  /**
   * The custom id Discord is given for a button of a plugin, so that a click can be sent back to
   * the plugin that made it. Throws if the plugin id has a ":" or the result is over 100
   * characters, which Discord does not accept.
   */
  function componentCustomId(cid: string, id: string): string

  /** Reads a custom id made by componentCustomId. Returns null for any other custom id. */
  function parseComponentCustomId(customId: string): { cid: string, id: string } | null

  /**
   * Moves data to new location, prioritizing existing data in new location if it exists.
   * @param {admin.Reference} root
   * @param {string} from location to copy data from
   * @param {string} to location to copy data to
   * @returns {Promise<boolean | 'merged'>} true if data moved to new location,
   * 'merged' if data was merged,
   * false if data did not exist.
   */
  function move(root: admin.database.Reference, from: string, to: string): Promise<boolean | 'merged'>
  
  /** A general Firebase-enabled module. */
  class Module extends EventEmitter {
    constructor(options: ModuleOptions)
    presenceSystem() : PresenceSystem
    messageSystem() : MessagingSystem
    /**
     * Offers commands, keyed by name. Once connected, any command missing from
     * config/<cid>/commands is added. Commands that already exist keep every edit made in the
     * database, and only gain the args the stored command does not have yet, placed next to
     * the args that the definition puts around them, unless the stored command sets argLock.
     * An arg whose definition has a choices property always gets those choices (none, if the
     * list is empty), also unless argLock is set, since the plugin owns them.
     * Call it again with new definitions, for example when the config changes, to publish
     * them right away if connected. Throws if a definition is invalid.
     */
    defaultCommands(definitions: { [name: string]: CommandDefinition }) : void
    /**
     * Calls the handler when someone clicks a button this plugin put on a message, and for no
     * other plugin's buttons. Buttons are sent in a reply as data.discord_components, see
     * buildComponents. The message is described like a command: uid is who clicked, text and
     * data.componentId are the id of the button, data.messageId is the message it was on, and
     * data.invokerId is who ran the command that made the message, or null. Answer it as you
     * answer a command, with the same interactionId: a reply edits the message the button is on,
     * and takes its buttons off unless it brings new ones, and a private reply is sent on its
     * own and leaves the message as it is.
     */
    onComponent(handler: (msg: IncomingMessage, ref: any) => void) : void
    /**
     * Send internal message with given data, returning a Promise that resolves with the internal message.
     */
    response(message: ResponseMessage, options?: ResponseOptions) : Promise<InternalMessage>
    /** Attempts to send an error to the database. */
    sendError(error: Error, timestamp?: number) : boolean
    
    destroyed() : boolean

    on(event: 'config', listener: (config: object, reference: Reference) => void) : this
    on(event: 'destroy', listener: () => void) : this
  }
  
  /** A plugin module. Overrides options.type to "plugin" */
  class Plugin extends Module {
    constructor(options?: ModuleOptions)
  }
  
  /**
   * A connector module. Overrides options.type to "connector"
   * and sets options.listenMode to "connector" if not already set.
   */
  class Connector extends Module {
    constructor(options?: ModuleOptions)
  }
  
  class MessagingSystem extends EventEmitter {
    /** Initialize the messaging system. */
    initialize(options: MessagingSystemOptions)
    
    /**
     * Reply to a message with simple text.
     * @param {string} text - The text to send.
     * @param {AKP48Message} msg - The message to reply to.
     * @param {object} [data] - data to send (merges over msg.data)
     */
    sendText(text: string, msg: AKP48Message, data: object) : ThenableReference
    
    /**
     * Send a message. The message provided is expected to be a full reply such as one provided by
     * `Utils.getReply()`.
     * @param {OutgoingMessage} msg The message to send.
     */
    sendMessage(msg: OutgoingMessage) : ThenableReference

    /** Clear all event emitter listeners. TODO: Not yet implemented */
    clearListeners()

    /**
     * Deletes the entire registry entry. Use if you no longer wish to store any information about
     * your plugin. TODO: Not yet implemented
     */
    remove()

    /** Called when messages are received from the database */
    on(event: 'message' | 'message/type' | 'message-direction' | 'message-self', listener: (message: AKP48Message, reference: Reference) => void) : this
  }

  class PresenceSystem extends EventEmitter {
    /** Initialize the presence system. */
    initialize(options: PresenceSystemOptions)

    /** Sets display name */
    setName(name: string)
    
    /** Clear all event emitter listeners. TODO: Not yet implemented */
    clearListeners()

    /**
     * Deletes the entire registry entry. Use if you no longer wish to store any information about
     * your plugin. TODO: Not yet implemented
     */
    remove()

    /** Whether or not the presence system is usable. */
    valid() : boolean

    on(event: 'connect' | 'disconnect', listener: () => void) : this
    on(event: 'status', listener: (status: string) => void) : this
  }
}

export = Utils
