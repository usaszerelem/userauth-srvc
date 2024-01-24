/**
 * This file contains an extensible password validation rules engine
 * that uses default password validation rules that can be externally
 * overwritten.
 * A submitted password for validation is analyed towards all validation
 * rules and an array is returned listing what validations failed.
 */

// Class validator types

export enum ValidationType {
    MinMaxLength, // Password min/max length
    LetterCasing, // Password number of upper case letters
    Symbols, // Password number of symbols
}

/**
 * Password validation rules type
 */
type PasswordValidationRules = {
    minLength: number;
    maxLength: number;
    minNumUppercase: number;
    minNumSymbols: number;
};

/**
 * Abstract class that all validation rule classed extend.
 * This is needed for an elegant simple validation where
 * we enumerate a list of classes that partake in the validation
 */
abstract class PassValidationRule {
    constructor(public type: ValidationType, public rules: PasswordValidationRules) {}

    abstract validate(password: string): boolean;

    get ruleType(): ValidationType {
        return this.type;
    }
}

/**
 * Implements the password length min/max validation rule
 */
class MinMaxLengthValidation extends PassValidationRule {
    constructor(rules: PasswordValidationRules) {
        super(ValidationType.MinMaxLength, rules);
    }

    override validate(password: string): boolean {
        if (password.length >= this.rules.minLength && password.length <= this.rules.maxLength) {
            return true;
        }

        return false;
    }
}

/**
 * Implements the password casing validation rule
 */
class CasingValidation extends PassValidationRule {
    constructor(rules: PasswordValidationRules) {
        super(ValidationType.LetterCasing, rules);
    }

    override validate(password: string): boolean {
        if (this.rules.minNumUppercase > 0) {
            let numUpper: number = (password.match(/[A-Z]/g) || []).length;

            return numUpper >= this.rules.minNumSymbols ? true : false;
        }

        return true;
    }
}

/**
 * Implements the password symbol validation rules
 */
class SymbolsValidation extends PassValidationRule {
    constructor(rules: PasswordValidationRules) {
        super(ValidationType.Symbols, rules);
    }

    override validate(password: string): boolean {
        if (this.rules.minNumSymbols > 0) {
            // List of valid password symbols
            const symbols: string = '~`! @#$%^&*()_-+={[}]|:;"\'<,>.?/';
            let symCount = 0;

            for (let idx = 0; idx < password.length; idx++) {
                if (symbols.includes(password[idx]) === true) {
                    symCount++;
                }
            }

            return symCount >= this.rules.minNumSymbols ? true : false;
        }

        return true;
    }
}

/**
 * Singleton class for password validation purposes as once the rules
 * were setup, these are not changing and only the password validator
 * method is called.
 */
export class PasswordValidator {
    private static instance: PasswordValidator;

    private constructor() {}

    public static getInstance(): PasswordValidator {
        if (!PasswordValidator.instance) {
            PasswordValidator.instance = new PasswordValidator();
        }

        return PasswordValidator.instance;
    }

    /**
     * Validates the provided password string towards a list
     * of password validation rules.
     * @param password - provide password string to validate
     * @returns - Array of validators that failed validation
     */
    public validate(password: string): ValidationType[] {
        const defRules: PasswordValidationRules = {
            minLength: 5,
            maxLength: 12,
            minNumUppercase: 1,
            minNumSymbols: 1,
        };

        const validators: PassValidationRule[] = [
            new MinMaxLengthValidation(defRules),
            new CasingValidation(defRules),
            new SymbolsValidation(defRules),
        ];

        let failedValidations: ValidationType[] = [];

        for (let i = 0; i < validators.length; i++) {
            if (validators[i].validate(password) === false) {
                failedValidations.push(validators[i].ruleType);
            }
        }

        return failedValidations;
    }
}
