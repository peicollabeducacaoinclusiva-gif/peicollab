import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@pei/ui';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Textarea,
} from '@pei/ui';
import { formatCPF, formatPhone } from '../../lib/validationSchemas';
import type { StudentFormData } from '../../lib/validationSchemas';

export function StudentFamilyData() {
    const { control } = useFormContext<StudentFormData>();

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Responsáveis Legais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="mother_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Mãe</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome completo da mãe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="father_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Pai</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome completo do pai" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={control}
                        name="guardian_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Responsável Legal (se diferente)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do responsável legal" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={control}
                            name="guardian_cpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF do Responsável</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="000.000.000-00"
                                            {...field}
                                            onChange={(e) => {
                                                const formatted = formatCPF(e.target.value);
                                                field.onChange(formatted);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="guardian_phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone do Responsável</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            {...field}
                                            onChange={(e) => {
                                                const formatted = formatPhone(e.target.value);
                                                field.onChange(formatted);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="guardian_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail do Responsável</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="emergency_contact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Contato</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do contato de emergência" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="emergency_phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone de Emergência</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            {...field}
                                            onChange={(e) => {
                                                const formatted = formatPhone(e.target.value);
                                                field.onChange(formatted);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Orientações Familiares</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={control}
                        name="family_guidance_notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observações sobre a Família</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Informações relevantes sobre a família e orientações..."
                                        rows={4}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
