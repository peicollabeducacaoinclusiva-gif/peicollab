import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@pei/ui';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Textarea,
} from '@pei/ui';
import type { StudentFormData } from '../../lib/validationSchemas';

export function StudentHealthData() {
    const { control } = useFormContext<StudentFormData>();

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informações de Saúde</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={control}
                        name="health_info"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Informações Gerais de Saúde</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Informações gerais sobre a saúde do aluno..."
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="allergies"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alergias</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Liste as alergias conhecidas..."
                                        rows={2}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="medications"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Medicamentos</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Medicamentos de uso contínuo ou emergencial..."
                                        rows={2}
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
