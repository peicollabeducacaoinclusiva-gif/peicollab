import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@pei/ui';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@pei/ui';
import type { StudentFormData } from '../../lib/validationSchemas';

interface StudentSchoolDataProps {
    schoolsData: any[];
    filteredClasses: any[];
}

export function StudentSchoolData({ schoolsData, filteredClasses }: StudentSchoolDataProps) {
    const { control } = useFormContext<StudentFormData>();

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informações Escolares</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="school_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Escola *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a escola" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {schoolsData.map((school) => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    {school.school_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="class_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Turma</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a turma" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Sem turma</SelectItem>
                                            {filteredClasses.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.class_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={control}
                            name="registration_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Matrícula</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Número de matrícula" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="student_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ID do Aluno</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ID único do aluno" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="enrollment_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Matrícula</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
