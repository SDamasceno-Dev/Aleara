# Dialog (Global)

Componente de modal global com Provider + hook `useDialog()`.

## Uso

```tsx
import { useDialog } from '@/components/dialog';

function Example() {
  const dialog = useDialog();
  return (
    <button
      onClick={() =>
        dialog.open({
          intent: 'message',
          title: 'Título',
          description: 'Conteúdo do diálogo',
        })
      }
    >
      Abrir
    </button>
  );
}
```

## Intents

- `alert`: vermelho (erro/crítico)
- `warning`: amarelo (atenção)
- `message`: vinho (informativo)

## API

- `DialogProvider`: envolve o app no `layout.tsx`.
- `useDialog().open({ intent, title, description, actions })`
- `useDialog().close()`
