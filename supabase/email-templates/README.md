# Correos de Loopy

Supabase → Authentication → Email Templates → Confirm sign up:

- Subject: `Confirmá tu cuenta de Loopy`
- Body: pegar el contenido completo de `confirm-signup.html` y guardar.
- Mantener `{{ .ConfirmationURL }}`: Supabase sustituye ese valor por el enlace de confirmación y conserva el destino de la app.

Para cambiar `Supabase Auth <noreply@mail.app.supabase.io>`:

Supabase → Authentication → configuración de SMTP → habilitar Custom SMTP.

| Campo | Valor |
| --- | --- |
| Sender name | Loopy |
| Sender email | Dirección de tu dominio verificada en el proveedor de correo |
| Host | Host SMTP que indique tu proveedor |
| Port | Puerto SMTP que indique tu proveedor |
| Username | Usuario SMTP que indique tu proveedor |
| Password | Credencial SMTP que indique tu proveedor |

Configurar y verificar el dominio en el proveedor antes de guardar. Las credenciales SMTP van solo en Supabase, nunca en variables VITE. Cambiar el diseño no modifica el remitente. Podés usar la vista previa del editor para revisar la plantilla antes de enviar una confirmación nueva.

Documentación: https://supabase.com/docs/guides/auth/auth-email-templates y https://supabase.com/docs/guides/auth/auth-smtp.
