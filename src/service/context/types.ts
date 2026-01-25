/*
 * Example context:
  * 1. user -> (user feature, )
  * 2. settings -> (settings feature, uri of settings)
  * 3. board -> (baord service)
  *     -> Task (selected, on board)
  *     OR
  *     -> [Task x 5] (selection)
  *
  * How does can do check this?  
  * */


export type Uri = string;

export class ContextEntry {
  uri: string
  ownerId: string

  constructor(uri: Uri, ownerId: string) {
    this.uri = uri
    this.ownerId = ownerId
  }
}

export class Context {

}


