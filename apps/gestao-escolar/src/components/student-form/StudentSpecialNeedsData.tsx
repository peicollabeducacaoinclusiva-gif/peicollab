import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@pei/ui';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Checkbox,
} from '@pei/ui';
import type { StudentFormData } from '../../lib/validationSchemas';
import { NEE_TYPES } from '../../lib/constants';

export function StudentSpecialNeedsData() {
    const { control, watch } = useFormContext<StudentFormData>();
    const hasSpecialNeeds = watch('has_special_needs');

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Necessidades Educacionais Especiais (NEE)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={control}
                        name="has_special_needs"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Aluno possui Necessidades Educacionais Especiais?
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    {hasSpecialNeeds && (
                        <div className="mt-4">
                            <FormLabel className="text-base">Tipos de NEE</FormLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <FormField
                                    control={control}
                                    name="special_needs_types"
                                    render={() => (
                                        <FormItem>
                                            {NEE_TYPES.map((item) => (
                                                <FormField
                                                    key={item.value}
                                                    control={control}
                                                    name="special_needs_types"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={item.value}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item.value)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), item.value])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== item.value
                                                                                    )
                                                                                );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {item.label}
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
