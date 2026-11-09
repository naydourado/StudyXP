import { NativeTabs } from 'expo-router/native-tabs';

import { Cores } from '@/constants/tema';

// barra de abas nativa (ios / android); icones sf symbols e material symbols
export default function Abas() {
  return (
    <NativeTabs
      backgroundColor={Cores.card}
      indicatorColor={Cores.badge}
      tintColor={Cores.primaria}
      labelStyle={{ selected: { color: Cores.primaria } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tarefas">
        <NativeTabs.Trigger.Label>Tarefas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checkmark.circle.fill" md="check_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="foco">
        <NativeTabs.Trigger.Label>Foco</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="timer" md="timer" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="humor">
        <NativeTabs.Trigger.Label>Humor</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="face.smiling" md="mood" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
