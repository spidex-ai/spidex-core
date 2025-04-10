import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export const prepareQueryRelations = async <T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    relations: string[],
) => {
    const relationAlias: {
        [key: string]: string;
    } = {};

    relations.forEach(relation => {
        const _relation = relation.includes('.') ? prepareRelationAlias(relation, false) : `${query.alias}.${relation}`;
        const _alias = prepareRelationAlias(relation);

        query.leftJoinAndSelect(_relation, _alias);

        relationAlias[relation] = _alias;
    });

    return relationAlias;
};

const prepareRelationAlias = (string: string, alias = true): string => {
    if (!string.includes('.') || (string.indexOf('.') === string.lastIndexOf('.') && !alias)) return string;

    const index = string.indexOf('.');
    return prepareRelationAlias(`${string.substring(0, index)}=>${string.substring(index + 1)}`, alias);
};
