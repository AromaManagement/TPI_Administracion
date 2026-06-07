import { z } from "zod";

const ROL_VALUES = ["ADMIN", "CLIENTE", "COCINERO", "REPARTIDOR"] as const;

export const loginSchema = z.object({
  correo: z.string().email("El formato del correo es inválido."),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const usuarioSchema = z.object({
  correo: z
    .string()
    .email("El formato del correo es inválido.")
    .max(150, "El correo no puede tener más de 150 caracteres."),
  contrasena: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres.")
    .max(255, "La contraseña no puede exceder los 255 caracteres."),
  nombre: z
    .string()
    .min(1, "El nombre es requerido.")
    .max(100, "El nombre no puede tener más de 100 caracteres."),
  apellido: z
    .string()
    .min(1, "El apellido es requerido.")
    .max(100, "El apellido no puede tener más de 100 caracteres."),
  rol: z.enum(ROL_VALUES, { message: "Debe seleccionar un rol." }),
});

/** En edición la contraseña es opcional (sólo se actualiza si se completa). */
export const usuarioUpdateSchema = usuarioSchema.partial({ contrasena: true });

export const localidadSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(150, "El nombre no puede tener más de 150 caracteres."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type UsuarioValues = z.infer<typeof usuarioSchema>;
export type LocalidadValues = z.infer<typeof localidadSchema>;
