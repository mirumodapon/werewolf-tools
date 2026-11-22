import { requestPersistentStorage } from '@werewolf/storage'
import 'virtual:uno.css'
import { startJudge } from './start.ts'

await startJudge()
void requestPersistentStorage()
