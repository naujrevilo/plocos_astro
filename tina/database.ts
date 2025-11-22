import { createLocalDatabase, TinaLevelClient } from '@tinacms/datalayer'

export default createLocalDatabase({ level: new TinaLevelClient() });