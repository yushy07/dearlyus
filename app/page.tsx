import {requireChatGPTUser} from '@/app/chatgpt-auth';
import OurSpace from '@/app/our-space-client';

export const dynamic='force-dynamic';

export default async function Home(){
  await requireChatGPTUser('/');
  return <OurSpace/>;
}
