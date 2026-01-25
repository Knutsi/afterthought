/*
 * Example context:
  * 1. user -> (user feature, )
  * 2. settings -> (settings feature, uri of settings)
  * 3. board -> (baord service)
  *     -> Task (selected, on board)
  *     OR
  *     -> [Task x 5] (selection, on board)
  *
  * How does canDo(context) check this? 
  *   TYPE is derived from URI task://GUID 
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


