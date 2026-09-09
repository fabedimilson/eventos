import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { generateAccessToken } from '../utils/security';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  pronoun?: string;
  category: 'ALUNO' | 'PROFESSOR' | 'TECNICO' | 'EXTERNO' | 'EGRESSO';
  matriculaOrSiape?: string;
  campus?: string;
  role: 'PARTICIPANTE' | 'ORGANIZADOR' | 'SUPER_ADMIN';
  isEgresso?: boolean;
}

export interface UpdateProfileDTO {
  name?: string;
  email?: string;
  password?: string;
  pronoun?: string;
  category?: string;
  bio?: string;
  avatarUrl?: string;
  campus?: string;
  matriculaOrSiape?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  lattesUrl?: string;
  interests?: string;
  isEgresso?: boolean;
  educationLevel?: string;
  employmentStatus?: string;
  currentCompanyOrInst?: string;
  currentRoleOrCourse?: string;
  graduationYear?: string;
  courseName?: string;
  alumniInterests?: string;
}

export class AuthService {
  async login({ email, password }: LoginDTO) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      category: user.category,
    });

    const { passwordHash, ...userProfile } = user;
    return { accessToken, user: userProfile };
  }

  async register(data: RegisterDTO) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    if (data.cpf) {
      const existingCpf = await userRepository.findByCpf(data.cpf);
      if (existingCpf) {
        throw new Error('Já existe um usuário cadastrado com este CPF.');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      cpf: data.cpf || null,
      pronoun: data.pronoun || null,
      category: data.category,
      isEgresso: Boolean(data.isEgresso || data.category === 'EGRESSO'),
      matriculaOrSiape: data.matriculaOrSiape || null,
      campus: data.campus || 'Campus Manaus - Centro',
      role: data.role,
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      category: user.category,
    });

    const { passwordHash: _, ...userProfile } = user;
    return { accessToken, user: userProfile };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const { passwordHash, ...userProfile } = user;
    return userProfile;
  }

  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const { password, ...updateFields } = data;
    const updateData: any = { ...updateFields };

    if (updateFields.email) {
      const currentUser = await userRepository.findById(userId);
      if (currentUser && currentUser.email !== updateFields.email.trim()) {
        const existingEmail = await userRepository.findByEmail(updateFields.email.trim());
        if (existingEmail) {
          throw new Error('O e-mail informado já está em uso por outro usuário.');
        }
      }
    }

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const user = await userRepository.updateProfile(userId, updateData);
    const { passwordHash, ...userProfile } = user;
    return {
      message: 'Perfil atualizado com sucesso!',
      user: userProfile,
    };
  }

  async updatePrivacy(userId: string, isInvisibleInNetworking: boolean) {
    const user = await userRepository.updatePrivacy(userId, Boolean(isInvisibleInNetworking));
    return {
      message: `Modo de privacidade atualizado com sucesso. Você agora está ${user.isInvisibleInNetworking ? 'Invisível' : 'Visível'} no Networking.`,
      user: {
        id: user.id,
        isInvisibleInNetworking: user.isInvisibleInNetworking,
      },
    };
  }

  async requestPasswordReset(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(cleanEmail);

    const genericResponse = {
      message: 'Se o e-mail estiver cadastrado, enviamos um código de verificação para redefinição de senha.',
    };

    if (!user) {
      return genericResponse;
    }

    // Gera um código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await userRepository.updateProfile(user.id, {
      resetPasswordCode: code,
      resetPasswordExpiresAt: expiresAt,
    });

    console.log(`🔑 [RECOVERY CODE] Código de recuperação para ${cleanEmail}: ${code}`);

    return {
      ...genericResponse,
      code: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyResetCode(email: string, code: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user || !user.resetPasswordCode || user.resetPasswordCode !== cleanCode) {
      throw new Error('Código de verificação inválido.');
    }

    if (user.resetPasswordExpiresAt && new Date(user.resetPasswordExpiresAt) < new Date()) {
      throw new Error('O código de verificação expirou. Por favor, solicite um novo código.');
    }

    return { message: 'Código verificado com sucesso.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    await this.verifyResetCode(email, code);

    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await userRepository.updateProfile(user.id, {
      passwordHash,
      resetPasswordCode: null,
      resetPasswordExpiresAt: null,
    });

    console.log(`✅ [PASSWORD RESET SUCCESS] Senha redefinida para o e-mail: ${cleanEmail}`);

    return {
      message: 'Sua senha foi redefinida com sucesso! Você já pode fazer login com a nova senha.',
    };
  }
}

export const authService = new AuthService();
